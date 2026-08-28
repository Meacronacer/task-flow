export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  role: string;
  memberCount: number;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}