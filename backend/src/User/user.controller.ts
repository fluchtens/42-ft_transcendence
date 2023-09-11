import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./user.model";

@Controller('api/v1/user')

export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUser(): Promise<User[]> {
    return this.userService.getAllUsers();
  }
  @Get(':id')
  async GetUser(@Param('id', ParseIntPipe) id : number) : Promise<User>{
    return this.userService.getUser(id);
  }
  @Post()
  async postUser(@Body() postData: User): Promise<User> {
    return this.userService.createUser(postData);
  }
}
