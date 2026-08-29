import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { tasksApi } from './tasks-api';
import type { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from '../model/types';

export const taskKeys = {
  all: (projectId: string) => ['tasks', projectId] as const,
  one: (projectId: string, taskId: string) =>
    ['tasks', projectId, taskId] as const,
};

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: taskKeys.all(projectId),
    queryFn: () => tasksApi.getByProject(projectId),
    enabled: Boolean(projectId),
  });
}

export function useTask(projectId: string, taskId: string) {
  return useQuery({
    queryKey: taskKeys.one(projectId, taskId),
    queryFn: () => tasksApi.getOne(projectId, taskId),
    enabled: Boolean(projectId) && Boolean(taskId),
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTaskDto) => tasksApi.create(projectId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      dto,
    }: {
      taskId: string;
      dto: UpdateTaskDto;
    }) => tasksApi.update(projectId, taskId, dto),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(
        taskKeys.one(projectId, updatedTask.id),
        updatedTask,
      );
      void queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
    },
  });
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, dto }: { taskId: string; dto: MoveTaskDto }) =>
      tasksApi.move(projectId, taskId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(projectId, taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) });
    },
  });
}