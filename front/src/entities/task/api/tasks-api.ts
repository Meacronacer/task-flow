import { api } from '@shared/api';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  MoveTaskDto,
} from '../model/types';

export const tasksApi = {
  getByColumn: async (
    projectId: string,
    columnId: string,
  ): Promise<Task[]> => {
    const { data } = await api.get<Task[]>(
      `/projects/${projectId}/columns/${columnId}/tasks`,
    );
    return data;
  },

  getByProject: async (projectId: string): Promise<Task[]> => {
    const { data } = await api.get<Task[]>(`/projects/${projectId}/tasks`);
    return data;
  },

  getOne: async (projectId: string, taskId: string): Promise<Task> => {
    const { data } = await api.get<Task>(
      `/projects/${projectId}/tasks/${taskId}`,
    );
    return data;
  },

  create: async (projectId: string, dto: CreateTaskDto): Promise<Task> => {
    const { data } = await api.post<Task>(
      `/projects/${projectId}/tasks`,
      dto,
    );
    return data;
  },

  update: async (
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> => {
    const { data } = await api.patch<Task>(
      `/projects/${projectId}/tasks/${taskId}`,
      dto,
    );
    return data;
  },

  move: async (
    projectId: string,
    taskId: string,
    dto: MoveTaskDto,
  ): Promise<Task> => {
    const { data } = await api.patch<Task>(
      `/projects/${projectId}/tasks/${taskId}/move`,
      dto,
    );
    return data;
  },

  remove: async (projectId: string, taskId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  },

  summarize: async (
    projectId: string,
    taskId: string,
  ): Promise<{ summary: string }> => {
    const { data } = await api.post<{ summary: string }>(
      `/projects/${projectId}/tasks/${taskId}/summarize`,
    );
    return data;
  },
};