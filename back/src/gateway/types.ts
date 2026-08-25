export type WsEventName =
  | 'task.created'
  | 'task.updated'
  | 'task.moved'
  | 'task.deleted'
  | 'column.created'
  | 'column.updated'
  | 'column.deleted'
  | 'comment.added'
  | 'member.online'
  | 'member.offline'
  | 'deadline.alert';

export interface WsTaskMovedPayload {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
  position: number;
  movedBy: string;
}

export interface WsTaskCreatedPayload {
  taskId: string;
  columnId: string;
  title: string;
  createdBy: string;
}

export interface WsTaskUpdatedPayload {
  taskId: string;
  fields: string[];
  updatedBy: string;
}

export interface WsTaskDeletedPayload {
  taskId: string;
  columnId: string;
  deletedBy: string;
}

export interface WsColumnPayload {
  columnId: string;
  title?: string;
  position?: number;
  changedBy: string;
}

export interface WsCommentPayload {
  commentId: string;
  taskId: string;
  content: string;
  authorId: string;
}

export interface WsMemberPayload {
  userId: string;
  projectId: string;
}

export interface WsDeadlineAlertPayload {
  taskId: string;
  taskTitle: string;
  deadline: Date;
}

export type WsPayload =
  | WsTaskMovedPayload
  | WsTaskCreatedPayload
  | WsTaskUpdatedPayload
  | WsTaskDeletedPayload
  | WsColumnPayload
  | WsCommentPayload
  | WsMemberPayload
  | WsDeadlineAlertPayload;
