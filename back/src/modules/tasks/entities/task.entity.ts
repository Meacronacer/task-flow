import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BoardColumn } from '../../columns/entities/column.entity';
import { TimeLog } from './time-log.entity';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'column_id' })
  columnId: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string | null;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date | null;

  @Column({ name: 'ai_summary', type: 'text', nullable: true })
  aiSummary: string | null;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => BoardColumn, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'column_id' })
  column: BoardColumn;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => TimeLog, (log) => log.task)
  timeLogs: TimeLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
