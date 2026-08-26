import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginDto, type RegisterDto } from './auth-api';
import { useUserStore } from '@entities/user/model';

export function useLogin() {
  const { setUser } = useUserStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: async () => {
      const user = await authApi.me();
      setUser(user);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('/dashboard', { replace: true });
    },
  });
}

export function useRegister() {
  const { setUser } = useUserStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (dto: RegisterDto) => authApi.register(dto),
    onSuccess: async () => {
      const user = await authApi.me();
      setUser(user);
      navigate('/dashboard', { replace: true });
    },
  });
}

export function useLogout() {
  const { logout } = useUserStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}

export function useMe() {
  const { setUser } = useUserStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    enabled: Boolean(localStorage.getItem('accessToken')),
    retry: false,
  });
}