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
import { RegisterDto } from './dtos/RegisterDto';
import { LoginDto } from './dtos/LoginDto';
import { SetupDto } from './dtos/SetupDto';
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
  async login(@Body() data: LoginDto, @Res({ passthrough: true }) res) {
    return this.authService.login(data, res);
  }

  @Get('42Auth')
  @UseGuards(FortyTwoAuthGuard)
  fortyTwoAuth(@Req() req, @Res({ passthrough: true }) res) {
    return this.authService.fortyTwoAuth(req, res);
  }

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  async setup(
    @Body() data: SetupDto,
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    return this.authService.setup(data, req, res);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res) {
    return this.authService.logout(res);
  }
}
