import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RegisterDto, SetupDto } from './auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

  private async generateJwtToken(payload: any, expiresIn: string) {
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: expiresIn,
    });
    return token;
  }

  private async setAccessTokenCookie(
    res: Response,
    token: string,
    expiresIn: number,
  ) {
    const expirationTime = new Date(Date.now() + expiresIn);
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      expires: expirationTime,
    });
  }

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

  async login(data: LoginDto, res: Response) {
    const { username, password } = data;

    const user = await this.findUserByUsername(username);
    if (!user || user.fortyTwoId) {
      throw new UnauthorizedException('Incorrect username or password');
    }

    const isPwdMatch = await bcrypt.compare(password, user.password);
    if (!isPwdMatch) {
      throw new UnauthorizedException('Incorrect username or password');
    }

    const payload = { id: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '2h',
    });

    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'strict',
    });

    return { message: 'User succesfully connected' };
  }

  async fortyTwoAuth(req, res) {
    const fortyTwoId: number = parseInt(req.user.id);
    // console.log(req.user._json.image.link);

    const user = await this.findUserByFortyTwoId(fortyTwoId);
    if (!user) {
      const payload = { fortyTwoId, toConfig: true };
      const token = await this.generateJwtToken(payload, '2h');
      await this.setAccessTokenCookie(res, token, 2 * 60 * 60 * 1000);

      return res.redirect(this.configService.get('VITE_FRONT_URL') + '/setup');
    }

    const payload = { id: user.id, username: user.username };
    const token = await this.generateJwtToken(payload, '2h');
    await this.setAccessTokenCookie(res, token, 2 * 60 * 60 * 1000);

    return res.redirect(this.configService.get('VITE_FRONT_URL'));
  }

  async setup(req, data, res) {
    const { username } = data;
    const { fortyTwoId, toConfig } = req.user;
    console.log(req.user);

    if (!toConfig) {
      throw new UnauthorizedException('Your account has already been set up');
    }

    let user = await this.findUserByFortyTwoId(fortyTwoId);
    if (!user) {
      user = await this.prismaService.user.create({
        data: { username, fortyTwoId, password: null },
      });
    }

    const payload = { id: user.id, username: user.username };
    const token = await this.generateJwtToken(payload, '2h');
    await this.setAccessTokenCookie(res, token, 2 * 60 * 60 * 1000);

    return { message: 'User succesfully connected' };
  }

  async logout(res: Response) {
    res.clearCookie('access_token');
    return { message: 'User succesfully disconnected' };
  }
}
