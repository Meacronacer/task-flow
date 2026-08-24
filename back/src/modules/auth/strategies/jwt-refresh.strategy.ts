import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type {
  JwtRefreshPayload,
  AuthenticatedUser,
} from '../types/jwt-payload.types';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: JwtRefreshPayload,
  ): AuthenticatedUser & {
    refreshTokenId: string;
    rawToken: string;
  } {
    const rawToken = (req.body as { refreshToken: string }).refreshToken;

    return {
      id: payload.sub,
      email: payload.email,
      refreshTokenId: payload.refreshTokenId,
      rawToken,
    };
  }
}
