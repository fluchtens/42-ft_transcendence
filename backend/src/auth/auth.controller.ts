import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, SetupDto } from './auth.dto';
import { Response, Request } from 'express';
import { FortyTwoAuthGuard } from './guards/42-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(data, res);
  }

  @Get('42Auth')
  @UseGuards(FortyTwoAuthGuard)
  fortyTwoAuthRedirect(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.fortyTwoAuth(req, res);
  }

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  async setup(
    @Req() req,
    @Body() data: SetupDto,
    @Res({ passthrough: true }) res,
  ) {
    return this.authService.setup(req, data, res);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }
}
