import { Injectable, NestMiddleware } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UserService } from "src/user/user.service";
import { NextFunction } from "express";

export interface RequestModel {
  user: any;
  headers: any;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ){}

    use(request: RequestModel, response: Response, next: NextFunction): any {
      try {
        const tokenArray
      }
      catch {

      }
    }

}