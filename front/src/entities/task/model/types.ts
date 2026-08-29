export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  columnId: string;
  projectId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  priority: TaskPriority;
  status: TaskStatus;
  position: number;
  deadline: string | null;
  aiSummary: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  columnId: string;
  description?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  deadline?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  deadline?: string | null;
}

export interface MoveTaskDto {
  columnId: string;
  position: number;
}