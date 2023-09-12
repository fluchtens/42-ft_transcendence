import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, Res } from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./user.model";
import { Request, Response } from "express";

@Controller('api/v1/user')

export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUser(): Promise<User[]> {
    return this.userService.getAllUsers();
  }
  @Get(':id')
  async GetUser(@Param('id', ParseIntPipe) id : number,
  @Res() res : Response,
  ) {
    const user = await this.userService.getUser(id);
    if (user){
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(user);
    }
    else{
      res.status(400).send({msg: 'User not found!'})
    }
  }
  @Post()
  async postUser(@Body() postData: User
  ) : Promise<User>{
    return this.userService.createUser(postData);
  }
}
