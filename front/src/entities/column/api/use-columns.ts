import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { columnsApi } from './columns-api';
import type { CreateColumnDto, UpdateColumnDto } from '../model/types';

export const columnKeys = {
  all: (projectId: string) => ['columns', projectId] as const,
};

export function useColumns(projectId: string) {
  return useQuery({
    queryKey: columnKeys.all(projectId),
    queryFn: () => columnsApi.getAll(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateColumn(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateColumnDto) => columnsApi.create(projectId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: columnKeys.all(projectId) });
    },
  });
}

export function useUpdateColumn(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      columnId,
      dto,
    }: {
      columnId: string;
      dto: UpdateColumnDto;
    }) => columnsApi.update(projectId, columnId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: columnKeys.all(projectId) });
    },
  });
}

export function useDeleteColumn(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) => columnsApi.remove(projectId, columnId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: columnKeys.all(projectId) });
    },
  });
}