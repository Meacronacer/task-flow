import { api } from '@shared/api';
import type { Column, CreateColumnDto, UpdateColumnDto } from '../model/types';

export const columnsApi = {
  getAll: async (projectId: string): Promise<Column[]> => {
    const { data } = await api.get<Column[]>(`/projects/${projectId}/columns`);
    return data;
  },

  create: async (projectId: string, dto: CreateColumnDto): Promise<Column> => {
    const { data } = await api.post<Column>(
      `/projects/${projectId}/columns`,
      dto,
    );
    return data;
  },

  update: async (
    projectId: string,
    columnId: string,
    dto: UpdateColumnDto,
  ): Promise<Column> => {
    const { data } = await api.patch<Column>(
      `/projects/${projectId}/columns/${columnId}`,
      dto,
    );
    return data;
  },

  remove: async (projectId: string, columnId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/columns/${columnId}`);
  },

  reorder: async (
    projectId: string,
    columns: Array<{ id: string; position: number }>,
  ): Promise<void> => {
    await api.patch(`/projects/${projectId}/columns/reorder`, { columns });
  },
};