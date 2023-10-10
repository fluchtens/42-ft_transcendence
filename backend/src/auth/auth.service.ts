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

  async register(registerDto: RegisterDto): Promise<any> {
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

  async login(loginDto: LoginDto, response: Response): Promise<any> {
    const { username, password } = loginDto;

    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPwdMatch = await bcrypt.compare(password, user.password);
    if (!isPwdMatch) throw new UnauthorizedException('User not found');

    const payload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '7d',
    });

    // response.cookie('access_token', token, {
    //   maxAge: 3600 * 1000,
    //   sameSite: 'none',
    //   secure: false,
    //   httpOnly: true,
    // });

    return { message: 'User succesfully connected', token: token };
  }
}
