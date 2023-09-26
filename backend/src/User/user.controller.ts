import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.model';
import { Request, Response } from 'express';
import { ChangeUsername, CreateUserDto, SerializedUser } from './user.dto';

@Controller('api/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  async getAllUser(): Promise<User[]> {
    return this.userService.getAllUsers();
  }
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async GetUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.getUser(id);
    if (!user) {
      throw new HttpException("User Don't Exist", HttpStatus.BAD_REQUEST);
    }
    return new SerializedUser(user);
  }
  @Post()
  @UsePipes(ValidationPipe)
  async postUser(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const user = await this.userService.createUser(createUserDto);
    if (user) {
      res.status(HttpStatus.CREATED).send(user);
    } else {
      throw new HttpException('User Exists', HttpStatus.BAD_REQUEST);
    }
  }
}
