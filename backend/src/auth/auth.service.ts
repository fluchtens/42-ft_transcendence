import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dtos/RegisterDto';
import { LoginDto } from './dtos/LoginDto';
import { SetupDto } from './dtos/SetupDto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { TwoFaDto } from './dtos/TwoFaDto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                   Private                                  */
  /* -------------------------------------------------------------------------- */

  private readonly cookieExpirationTime = 2 * 60 * 60 * 1000;

  private async generateJwtToken(payload: any, expiresIn: string) {
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: expiresIn,
    });

    return token;
  }

  private async setAccessTokenCookie(res, token: string, expiresIn: number) {
    const expirationTime = new Date(Date.now() + expiresIn);

    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      expires: expirationTime,
    });
  }

  private async downloadAvatar(fortyTwoId: number, fortyTwoAvatar: string) {
    const response = await fetch(fortyTwoAvatar);
    const buffer = await response.buffer();

    const uploadPath = './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    const fileExtension = path.extname(fortyTwoAvatar);
    const fileName = `42-${fortyTwoId}${fileExtension}`;
    const filePath = path.join(uploadPath, fileName);
    fs.writeFileSync(filePath, buffer);

    return fileName;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  async register(body: RegisterDto) {
    const { username, password } = body;

    const user = await this.userService.findUserByUsername(username);
    if (user) {
      throw new ConflictException('This username is already taken');
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    await this.prismaService.user.create({
      data: { username, password: hashedPwd },
    });

    return { message: 'User succesfully created' };
  }

  async login(session, body: LoginDto, res) {
    const { username, password } = body;

    const user = await this.userService.findUserByUsername(username);
    if (!user || user.fortyTwoId) {
      throw new UnauthorizedException('Incorrect username or password');
    }

    const matchPwd = await bcrypt.compare(password, user.password);
    if (!matchPwd) {
      throw new UnauthorizedException('Incorrect username or password');
    }

    if (user.twoFa) {
      session.userId = user.id;
      session.twoFa = true;

      return { message: '2FA code required', twoFa: true };
    }

    const payload = { id: user.id };
    const token = await this.generateJwtToken(payload, '2h');
    await this.setAccessTokenCookie(res, token, this.cookieExpirationTime);

    return { message: 'User succesfully connected' };
  }

  async logout(res) {
    res.clearCookie('access_token');

    return { message: 'User succesfully disconnected' };
  }

  /* -------------------------------------------------------------------------- */
  /*                                     42                                     */
  /* -------------------------------------------------------------------------- */

  async fortyTwoAuth(req, session, res) {
    const fortyTwoId: number = parseInt(req.user.id);
    const fortyTwoAvatar: string = req.user._json.image.link;

    const user = await this.userService.findUserByFortyTwoId(fortyTwoId);
    if (!user) {
      session.fortyTwoId = fortyTwoId;
      session.fortyTwoAvatar = fortyTwoAvatar;

      return res.redirect(process.env.VITE_FRONT_URL + '/register/setup');
    }

    if (user.twoFa) {
      session.userId = user.id;
      session.twoFa = true;

      return res.redirect(process.env.VITE_FRONT_URL + '/login/twofa');
    }

    const payload = { id: user.id, username: user.username };
    const token = await this.generateJwtToken(payload, '2h');
    await this.setAccessTokenCookie(res, token, this.cookieExpirationTime);

    return res.redirect(process.env.VITE_FRONT_URL);
  }

  async setup(session, body: SetupDto, res) {
    const { fortyTwoId, fortyTwoAvatar } = session;
    const { username } = body;

    if (!fortyTwoId) {
      throw new UnauthorizedException('You are not logged in');
    }

    let user = await this.userService.findUserByUsername(username);
    if (user) {
      throw new ConflictException('This username is already taken');
    }
    user = await this.prismaService.user.create({
      data: { username, fortyTwoId, password: null },
    });

    if (fortyTwoAvatar) {
      const avatar = await this.downloadAvatar(fortyTwoId, fortyTwoAvatar);
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { avatar },
      });
    }

    const payload = { id: user.id, username: user.username };
    const token = await this.generateJwtToken(payload, '2h');
    await this.setAccessTokenCookie(res, token, this.cookieExpirationTime);

    return { message: 'User succesfully connected' };
  }

  /* -------------------------------------------------------------------------- */
  /*                                     2FA                                    */
  /* -------------------------------------------------------------------------- */

  async generateTwoFaQrCode(req) {
    const { id } = req.user;

    const user = await this.userService.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    } else if (user.twoFa) {
      throw new BadRequestException('2FA already enabled');
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(id, 'ft_transcendence', secret);
    await this.userService.updateUserTwoFaSecret(id, secret);
    const qrcode = await toDataURL(otpAuthUrl);

    return { message: '2FA QRCode successfully generated', qrcode };
  }

  async enableTwoFa(req, body: TwoFaDto) {
    const { id } = req.user;
    const { code } = body;

    const user = await this.userService.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    } else if (user.twoFa) {
      throw new BadRequestException('2FA already enabled');
    } else if (!user.twoFaSecret) {
      throw new NotFoundException('2FA secret not found');
    }

    const isValidToken = authenticator.verify({
      token: code,
      secret: user.twoFaSecret,
    });
    if (!isValidToken) {
      throw new UnauthorizedException('Invalid 2FA code');
    }
    await this.userService.updateUserTwoFa(id, true);

    return { message: '2FA successfully enabled' };
  }

  async disableTwoFa(req) {
    const { id } = req.user;

    const user = await this.userService.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    } else if (!user.twoFa) {
      throw new BadRequestException('2FA already disabled');
    } else {
      await this.userService.updateUserTwoFa(id, false);
      await this.userService.updateUserTwoFaSecret(id, null);
    }

    return { message: '2FA successfully disabled' };
  }

  async authTwoFa(session, body: TwoFaDto, res) {
    const { userId, twoFa } = session;
    const { code } = body;

    if (!userId || !twoFa) {
      throw new UnauthorizedException('You are not logged in');
    }

    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    } else if (!user.twoFa) {
      throw new BadRequestException('2FA not enabled');
    } else if (!user.twoFaSecret) {
      throw new NotFoundException('2FA secret not found');
    }

    const isValidToken = authenticator.verify({
      token: code,
      secret: user.twoFaSecret,
    });
    if (!isValidToken) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const payload = { id: userId };
    const token = await this.generateJwtToken(payload, '2h');
    await this.setAccessTokenCookie(res, token, this.cookieExpirationTime);

    return { message: 'User succesfully connected' };
  }
}
