import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request.cookies['access_token'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload.toConfig) {
      return { fortyTwoId: payload.fortyTwoId, toConfig: payload.toConfig };
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { id: payload.id, username: payload.username };
  }
}
