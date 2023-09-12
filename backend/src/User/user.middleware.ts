import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class ValidateUserMiddleware implements NestMiddleware {
  use (req: Request, res: Response, next: NextFunction){
    console.log('inside ValidateUserMiddleware')
    // const { authorization } = req.headers;
    // if (!authorization)
    //   return res.status(403).send({ error: 'No Authentication Token Provided' });
    next();
  }
}

@Injectable()
export class ValidateUserAccountMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction){
    console.log('inside ValidateUserAccountMiddleware')
    next()
  }
}