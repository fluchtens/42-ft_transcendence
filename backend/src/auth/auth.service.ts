import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';
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

  async register(registerDto: RegisterDto) {
    const { username, password } = registerDto;

    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (user) {
      throw new ConflictException('This username is already taken');
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    await this.prismaService.user.create({
      data: { username, password: hashedPwd },
    });

    return { message: 'User succesfully created' };
  }

  async login(loginDto: LoginDto, response: Response) {
    const { username, password } = loginDto;

    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new UnauthorizedException('Incorrect username or password');
    }

    const isPwdMatch = await bcrypt.compare(password, user.password);
    if (!isPwdMatch) {
      throw new UnauthorizedException('Incorrect username or password');
    }

    const payload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '2h',
    });

    response.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'strict',
    });

    return { message: 'User succesfully connected' };
  }

  async fortyTwoAuth(req, res) {
    const { username } = req.user;

    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!user) {
      await this.prismaService.user.create({
        data: { username, password: null },
      });
    }

    const payload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '2h',
    });

    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'strict',
    });

    return { message: 'User succesfully connected', token: token };
  }
}
