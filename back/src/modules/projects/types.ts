export interface ProjectWithRole {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  role: string;
  memberCount: number;
}
