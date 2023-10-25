import {
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
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private readonly cookieExpirationTime = 2 * 60 * 60 * 1000;

  private async findUserById(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  private async findUserByUsername(username: string) {
    return this.prismaService.user.findUnique({
      where: { username },
    });
  }

  private async findUserByFortyTwoId(fortyTwoId: number) {
    return this.prismaService.user.findUnique({
      where: { fortyTwoId },
    });
  }

  private async updateUserTwoFaSecret(id: number, twoFaSecret: string) {
    return this.prismaService.user.update({
      where: { id },
      data: { twoFaSecret },
    });
  }

  private async generateJwtToken(payload: any, expiresIn: string) {
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
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

  async register(data: RegisterDto) {
    const { username, password } = data;

    const user = await this.findUserByUsername(username);
    if (user) {
      throw new ConflictException('This username is already taken');
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    await this.prismaService.user.create({
      data: { username, password: hashedPwd },
    });

    return { message: 'User succesfully created' };
  }

  async login(data: LoginDto, res) {
    const { username, password } = data;

    const user = await this.findUserByUsername(username);
    if (!user || user.fortyTwoId) {
      throw new UnauthorizedException('Incorrect username or password');
    }

    const matchPwd = await bcrypt.compare(password, user.password);
    if (!matchPwd) {
      throw new UnauthorizedException('Incorrect username or password');
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

  async fortyTwoAuth(req, res) {
    const fortyTwoId: number = parseInt(req.user.id);
    const fortyTwoAvatar: string = req.user._json.image.link;

    const user = await this.findUserByFortyTwoId(fortyTwoId);
    if (!user) {
      const payload = { fortyTwoId, fortyTwoAvatar };
      const token = await this.generateJwtToken(payload, '2h');
      await this.setAccessTokenCookie(res, token, this.cookieExpirationTime);

      return res.redirect(this.configService.get('VITE_FRONT_URL') + '/setup');
    }

    const payload = { id: user.id, username: user.username };
    const token = await this.generateJwtToken(payload, '2h');
    await this.setAccessTokenCookie(res, token, this.cookieExpirationTime);

    return res.redirect(this.configService.get('VITE_FRONT_URL'));
  }

  async setup(data: SetupDto, req, res) {
    const { username } = data;
    const { fortyTwoId, fortyTwoAvatar } = req.user;

    if (!fortyTwoId) {
      throw new UnauthorizedException('Your account has already been set up');
    }

    let user = await this.findUserByUsername(username);
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

  async twoFaGenerate(req) {
    const { id } = req.user;

    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(id, 'ft_transcendence', secret);
    await this.updateUserTwoFaSecret(id, secret);

    const qrcode = await toDataURL(otpAuthUrl);

    return { message: 'c generate bg', secret, otpAuthUrl, qrcode };
  }
}
