export interface Column {
  id: string;
  projectId: string;
  title: string;
  position: number;
  createdAt: string;
}

export interface CreateColumnDto {
  title: string;
  position?: number;
}

export interface UpdateColumnDto {
  title?: string;
  position?: number;
}