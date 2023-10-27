import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
  Session,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/RegisterDto';
import { LoginDto } from './dtos/LoginDto';
import { SetupDto } from './dtos/SetupDto';
import { FortyTwoAuthGuard } from './guards/42-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(
    @Session() session,
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res,
  ) {
    return this.authService.login(session, body, res);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res) {
    return this.authService.logout(res);
  }

  /* -------------------------------------------------------------------------- */
  /*                                     42                                     */
  /* -------------------------------------------------------------------------- */

  @Get('42Auth')
  @UseGuards(FortyTwoAuthGuard)
  fortyTwoAuth(@Req() req, @Res({ passthrough: true }) res) {
    return this.authService.fortyTwoAuth(req, res);
  }

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  async setup(
    @Body() body: SetupDto,
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    return this.authService.setup(body, req, res);
  }

  /* -------------------------------------------------------------------------- */
  /*                                     2FA                                    */
  /* -------------------------------------------------------------------------- */

  @Get('2fa/generate')
  @UseGuards(JwtAuthGuard)
  async generateTwoFaQrCode(@Req() req) {
    return this.authService.generateTwoFaQrCode(req);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  async enableTwoFa(@Req() req, @Body() body) {
    return this.authService.enableTwoFa(req, body);
  }

  @Get('2fa/disable')
  @UseGuards(JwtAuthGuard)
  async disableTwoFa(@Req() req) {
    return this.authService.disableTwoFa(req);
  }

  @Post('2fa/auth')
  async authTwoFa(
    @Session() session,
    @Body() body,
    @Res({ passthrough: true }) res,
  ) {
    return this.authService.authTwoFa(session, body, res);
  }
}
