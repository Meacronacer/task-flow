import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../shared/redis/redis.service';
import { User } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'john@example.com',
  name: 'John Doe',
  passwordHash: '$2b$10$hashedpassword',
  avatarUrl: null,
  googleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRefreshToken: RefreshToken = {
  id: '223e4567-e89b-12d3-a456-426614174001',
  userId: mockUser.id,
  user: mockUser,
  tokenHash: '$2b$10$hashedtoken',
  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const mockUsersService: Partial<UsersService> = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
    };

    const mockJwtService: Partial<JwtService> = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
    };

    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn().mockReturnValue('mock-secret'),
    };

    const mockRedisService: Partial<RedisService> = {
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockRefreshTokenRepo: jest.Mocked<{
      findOne: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
      update: jest.Mock;
      remove: jest.Mock;
    }> = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepo,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login and return tokens', async () => {
      const usersService = service['usersService'] as jest.Mocked<UsersService>;

      const refreshTokenRepo = service['refreshTokenRepo'] as jest.Mocked<
        (typeof service)['refreshTokenRepo']
      >;

      const redisService = service['redisService'] as jest.Mocked<RedisService>;

      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        mockUser,
      );

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      (refreshTokenRepo.create as jest.Mock).mockReturnValue(mockRefreshToken);

      (refreshTokenRepo.save as jest.Mock).mockResolvedValue(mockRefreshToken);

      (refreshTokenRepo.update as jest.Mock).mockResolvedValue(undefined);

      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      const result = await service.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith(
        'john@example.com',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const usersService = service['usersService'] as jest.Mocked<UsersService>;

      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const usersService = service['usersService'] as jest.Mocked<UsersService>;

      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        mockUser,
      );

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'john@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if token record not found', async () => {
      const refreshTokenRepo = service['refreshTokenRepo'] as jest.Mocked<
        (typeof service)['refreshTokenRepo']
      >;

      (refreshTokenRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.refresh(
          mockUser.id,
          mockUser.email,
          mockRefreshToken.id,
          'rawtoken',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token expired', async () => {
      const refreshTokenRepo = service['refreshTokenRepo'] as jest.Mocked<
        (typeof service)['refreshTokenRepo']
      >;

      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000),
      };

      (refreshTokenRepo.findOne as jest.Mock).mockResolvedValue(expiredToken);

      (refreshTokenRepo.remove as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.refresh(
          mockUser.id,
          mockUser.email,
          mockRefreshToken.id,
          'rawtoken',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should remove refresh token and blacklist in redis', async () => {
      const refreshTokenRepo = service['refreshTokenRepo'] as jest.Mocked<
        (typeof service)['refreshTokenRepo']
      >;

      const redisService = service['redisService'] as jest.Mocked<RedisService>;

      (refreshTokenRepo.findOne as jest.Mock).mockResolvedValue(
        mockRefreshToken,
      );

      (refreshTokenRepo.remove as jest.Mock).mockResolvedValue(undefined);

      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      await service.logout(mockRefreshToken.id, mockUser.id);

      expect(refreshTokenRepo.remove).toHaveBeenCalledWith(mockRefreshToken);

      expect(redisService.set).toHaveBeenCalled();
    });
  });
});
