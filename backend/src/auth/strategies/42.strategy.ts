import { Strategy } from 'passport-42';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
  constructor(
    configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      clientID:
        'u-s4t2ud-f80131a9603828942f8033274376e698e8b767d2480d22e69afa464157bb4ce2',
      clientSecret:
        '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',
      callbackURL: 'http://localhost:3000/api/auth/42/callback',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    return profile;
  }
}
