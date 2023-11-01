import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { multerAvatarOptions } from './middlewares/multer.options';
import { UsernameDto } from './dtos/UsernameDto';
import { UpdatePwdDto } from './dtos/UpdatePwdDto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUser(@Req() req) {
    return this.userService.getUser(req);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(parseInt(id));
  }

  @Get('username/:username')
  @UseGuards(JwtAuthGuard)
  async getUserByUsername(@Param('username') username: string) {
    return this.userService.getUserByUsername(username);
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Username                                  */
  /* -------------------------------------------------------------------------- */

  @Post('username')
  @UseGuards(JwtAuthGuard)
  async postUsername(@Req() req, @Body() body: UsernameDto) {
    return this.userService.changeUsername(req, body);
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Password                                  */
  /* -------------------------------------------------------------------------- */

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async putPassword(@Req() req, @Body() body: UpdatePwdDto) {
    return this.userService.changePassword(req, body);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Avatar                                   */
  /* -------------------------------------------------------------------------- */

  @Get('avatar/:filename')
  async getAvatar(@Param('filename') filename: string, @Res() res) {
    return this.userService.getAvatar(filename, res);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', multerAvatarOptions))
  async postAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.userService.postAvatar(req, file);
  }
}
