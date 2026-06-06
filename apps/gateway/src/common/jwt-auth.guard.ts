import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from '@goodshares/shared';

export interface AuthedRequest extends Request {
  user: { id: string; email: string; username: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('missing bearer token');
    try {
      const payload = this.jwt.verify<JwtPayload>(header.slice('Bearer '.length));
      req.user = { id: payload.sub, email: payload.email, username: payload.username };
      return true;
    } catch {
      throw new UnauthorizedException('invalid token');
    }
  }
}
