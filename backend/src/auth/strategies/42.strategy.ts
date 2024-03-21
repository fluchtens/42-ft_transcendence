import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
  constructor() {
    super({
      clientID: process.env.FORTY_TWO_UID,
      clientSecret: process.env.FORTY_TWO_SECRET,
      callbackURL: process.env.VITE_BACK_URL + '/auth/42',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return profile;
  }
}
