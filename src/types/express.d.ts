import { JwtPayload } from '@middlewares/auth.guard';
import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

declare module 'express' {
  export interface Request {
    user?: JwtPayload;
  }
}
