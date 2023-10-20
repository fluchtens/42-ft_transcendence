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

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private readonly cookieExpirationTime = 2 * 60 * 60 * 1000;

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

  private async setAccessTokenCookie(res, token: string, expiresIn: number) {
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

  async fortyTwoAuth(req, res) {
    const fortyTwoId: number = parseInt(req.user.id);
    const avatar: string = req.user._json.image.link;

    const user = await this.findUserByFortyTwoId(fortyTwoId);
    if (!user) {
      const payload = { fortyTwoId, avatar };
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
    const { fortyTwoId, avatar } = req.user;

    if (!fortyTwoId) {
      throw new UnauthorizedException('Your account has already been set up');
    }

    let user = await this.findUserByUsername(username);
    if (user) {
      throw new ConflictException('This username is already taken');
    }
    user = await this.prismaService.user.create({
      data: { username, fortyTwoId, avatar, password: null },
    });

    const payload = { id: user.id, username: user.username };
    const token = await this.generateJwtToken(payload, '2h');
    await this.setAccessTokenCookie(res, token, this.cookieExpirationTime);

    return { message: 'User succesfully connected' };
  }

  async logout(res) {
    res.clearCookie('access_token');

    return { message: 'User succesfully disconnected' };
  }
}
