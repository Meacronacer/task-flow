import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../shared/redis/redis.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokensDto } from './dto/tokens.dto';
import { JwtPayload, JwtRefreshPayload } from './types/jwt-payload.types';
import type { StringValue } from 'ms';

const BCRYPT_ROUNDS = 10;
const REFRESH_TOKEN_TTL_DAYS = 30;
const SECONDS_IN_DAY = 86400;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto): Promise<TokensDto> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    return this.generateAndSaveTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<TokensDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(dto.password, user.passwordHash ?? '');
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateAndSaveTokens(user.id, user.email);
  }

  async refresh(
    userId: string,
    email: string,
    refreshTokenId: string,
    rawToken: string,
  ): Promise<TokensDto> {
    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: { id: refreshTokenId, userId },
    });

    if (!tokenRecord) throw new UnauthorizedException('Invalid refresh token');

    if (tokenRecord.expiresAt < new Date()) {
      await this.refreshTokenRepo.remove(tokenRecord);
      throw new UnauthorizedException('Refresh token expired');
    }

    const isValid = await bcrypt.compare(rawToken, tokenRecord.tokenHash);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    await this.refreshTokenRepo.remove(tokenRecord);

    return this.generateAndSaveTokens(userId, email);
  }

  async logout(refreshTokenId: string, userId: string): Promise<void> {
    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: { id: refreshTokenId, userId },
    });

    if (tokenRecord) {
      await this.refreshTokenRepo.remove(tokenRecord);
    }

    await this.redisService.set(
      `blacklist:${refreshTokenId}`,
      '1',
      15 * 60, // 15 minutes
    );
  }

  private async generateAndSaveTokens(
    userId: string,
    email: string,
  ): Promise<TokensDto> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    const tokenRecord = this.refreshTokenRepo.create({
      userId,
      tokenHash: 'pending',
      expiresAt,
    });
    const saved = await this.refreshTokenRepo.save(tokenRecord);

    const accessPayload: JwtPayload = { sub: userId, email };
    const refreshPayload: JwtRefreshPayload = {
      sub: userId,
      email,
      refreshTokenId: saved.id,
    };

    const accessToken = this.jwtService.sign(accessPayload);
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<StringValue>('JWT_REFRESH_EXPIRES'),
    });

    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.refreshTokenRepo.update(saved.id, { tokenHash });

    await this.redisService.set(
      `refresh:${userId}:${saved.id}`,
      '1',
      REFRESH_TOKEN_TTL_DAYS * SECONDS_IN_DAY,
    );

    return { accessToken, refreshToken };
  }
}
