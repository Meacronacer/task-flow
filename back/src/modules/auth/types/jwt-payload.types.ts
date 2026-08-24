export interface JwtPayload {
  sub: string;
  email: string;
}

export interface JwtRefreshPayload extends JwtPayload {
  refreshTokenId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}
