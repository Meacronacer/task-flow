import { api } from '@shared/api';
import type { Project, ProjectMember, CreateProjectDto } from '../model';

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await api.get<Project[]>('/projects');
    return data;
  },

  getOne: async (id: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  create: async (dto: CreateProjectDto): Promise<Project> => {
    const { data } = await api.post<Project>('/projects', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateProjectDto>): Promise<Project> => {
    const { data } = await api.patch<Project>(`/projects/${id}`, dto);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const { data } = await api.get<ProjectMember[]>(
      `/projects/${projectId}/members`,
    );
    return data;
  },

  inviteMember: async (
    projectId: string,
    dto: { email: string; role?: string },
  ): Promise<ProjectMember> => {
    const { data } = await api.post<ProjectMember>(
      `/projects/${projectId}/members`,
      dto,
    );
    return data;
  },
};