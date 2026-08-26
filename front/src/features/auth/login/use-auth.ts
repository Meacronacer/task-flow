import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginDto, type RegisterDto } from './auth-api';
import { useUserStore } from '@entities/user/model';

export function useLogin() {
  const { setUser } = useUserStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: async () => {
      const me = await authApi.me();
      setUser(me.data);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useRegister() {
  const { setUser } = useUserStore();

  return useMutation({
    mutationFn: (dto: RegisterDto) => authApi.register(dto),
    onSuccess: async () => {
      const me = await authApi.me();
      setUser(me.data);
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
      const response = await authApi.me();
      setUser(response.data);
      return response.data;
    },
    enabled: Boolean(localStorage.getItem('accessToken')),
    retry: false,
  });
}
