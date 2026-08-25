import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

interface JwtPayload {
  sub: string;
  email: string;
}

interface SocketWithUser extends Socket {
  data: {
    user: { id: string; email: string };
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<SocketWithUser>();

    const token =
      (client.handshake.auth as Record<string, string | undefined>).token ??
      (client.handshake.query as Record<string, string | undefined>).token;

    if (!token) {
      throw new WsException(new UnauthorizedException('Missing token'));
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      client.data.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new WsException(new UnauthorizedException('Invalid token'));
    }
  }
}
