import { api, setTokens, clearTokens } from '@shared/api';
import type { AuthResponse, MeResponse } from '@entities/user/model';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', dto);
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data;
  },

  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', dto);
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  me: async (): Promise<MeResponse> => {
    const { data } = await api.get<MeResponse>('/auth/me');
    return data;
  },
};