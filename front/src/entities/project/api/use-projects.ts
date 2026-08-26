import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from './projects-api';
import type { CreateProjectDto } from '../model';

export const projectKeys = {
  all: ['projects'] as const,
  one: (id: string) => ['projects', id] as const,
  members: (id: string) => ['projects', id, 'members'] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => projectsApi.getAll(),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.one(id),
    queryFn: () => projectsApi.getOne(id),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateProjectDto) => projectsApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}