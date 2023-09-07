import { Body, Controller, Get, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./user.model";

@Controller('api/v1/user')
export class UserController{
  constructor(private readonly userService: UserService){}

  @Get()
  async getAllUser(): Promise<User[]>{
    return this.userService.getAllUsers()
  }
  @Post()
  async postUser(@Body() postData: User):Promise<User>{
    return this.userService.createUser(postData)
  }
}