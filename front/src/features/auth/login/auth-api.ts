import { api, setTokens, clearTokens } from '@shared/api';
import type { User } from '@entities/user/model';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthTokens> => {
    const { data } = await api.post<AuthTokens>('/auth/login', dto);
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  register: async (dto: RegisterDto): Promise<AuthTokens> => {
    const { data } = await api.post<AuthTokens>('/auth/register', dto);
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};