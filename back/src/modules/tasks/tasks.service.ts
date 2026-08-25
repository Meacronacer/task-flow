import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { TimeLog } from './entities/time-log.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { BoardColumn } from '../columns/entities/column.entity';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepo: Repository<Task>,
    @InjectRepository(TimeLog)
    private timeLogsRepo: Repository<TimeLog>,
    @InjectRepository(BoardColumn)
    private columnsRepo: Repository<BoardColumn>,
    private projectsService: ProjectsService,
    private dataSource: DataSource,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────

  async create(
    projectId: string,
    userId: string,
    dto: CreateTaskDto,
  ): Promise<Task> {
    // Проверяем что колонка принадлежит проекту
    const column = await this.columnsRepo.findOne({
      where: { id: dto.columnId, projectId },
    });
    if (!column) {
      throw new NotFoundException('Column not found in this project');
    }

    const task = this.tasksRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      columnId: dto.columnId,
      projectId,
      assigneeId: dto.assigneeId ?? null,
      priority: dto.priority,
      position: dto.position,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      status: TaskStatus.TODO,
      createdBy: userId,
    });

    const saved = await this.tasksRepo.save(task);

    await this.projectsService.logActivity(projectId, userId, 'task.created', {
      taskId: saved.id,
      title: saved.title,
      columnId: saved.columnId,
    });

    return saved;
  }

  async findAll(projectId: string, columnId?: string): Promise<Task[]> {
    const where = columnId ? { projectId, columnId } : { projectId };

    return this.tasksRepo.find({
      where,
      relations: { assignee: true, creator: true },
      order: { columnId: 'ASC', position: 'ASC' },
    });
  }

  async findOne(taskId: string): Promise<Task> {
    const task = await this.tasksRepo.findOne({
      where: { id: taskId },
      relations: { assignee: true, creator: true, timeLogs: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(
    taskId: string,
    userId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(taskId);
    const prevStatus = task.status;

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.assigneeId !== undefined) task.assigneeId = dto.assigneeId ?? null;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.deadline !== undefined) {
      task.deadline = dto.deadline ? new Date(dto.deadline) : null;
    }

    // Инвалидируем AI-саммари при смене статуса
    if (dto.status !== undefined && dto.status !== prevStatus) {
      task.aiSummary = null;
    }

    const saved = await this.tasksRepo.save(task);

    await this.projectsService.logActivity(
      task.projectId,
      userId,
      'task.updated',
      {
        taskId,
        fields: Object.keys(dto),
      },
    );

    return saved;
  }

  async remove(taskId: string, userId: string): Promise<void> {
    const task = await this.findOne(taskId);
    await this.tasksRepo.remove(task);

    await this.projectsService.logActivity(
      task.projectId,
      userId,
      'task.deleted',
      {
        taskId,
        title: task.title,
      },
    );
  }

  // ─── Move (drag & drop) ───────────────────────────────────────────

  async move(taskId: string, userId: string, dto: MoveTaskDto): Promise<Task> {
    const task = await this.findOne(taskId);

    // Проверяем что целевая колонка в том же проекте
    const targetColumn = await this.columnsRepo.findOne({
      where: { id: dto.columnId, projectId: task.projectId },
    });
    if (!targetColumn) {
      throw new NotFoundException('Target column not found in this project');
    }

    const fromColumnId = task.columnId;
    task.columnId = dto.columnId;
    task.position = dto.position;

    const saved = await this.tasksRepo.save(task);

    await this.projectsService.logActivity(
      task.projectId,
      userId,
      'task.moved',
      {
        taskId,
        fromColumnId,
        toColumnId: dto.columnId,
        position: dto.position,
      },
    );

    return saved;
  }

  async reorder(
    projectId: string,
    columnId: string,
    dto: ReorderTasksDto,
  ): Promise<Task[]> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.tasks) {
        await manager.update(
          Task,
          { id: item.id, projectId, columnId },
          { position: item.position },
        );
      }
    });

    return this.findAll(projectId, columnId);
  }

  // ─── Time Tracker ─────────────────────────────────────────────────

  async startTimer(taskId: string, userId: string): Promise<TimeLog> {
    const active = await this.timeLogsRepo.findOne({
      where: { taskId, userId, endedAt: IsNull() },
    });
    if (active) {
      throw new BadRequestException('Timer is already running for this task');
    }

    const log = this.timeLogsRepo.create({
      taskId,
      userId,
      startedAt: new Date(),
      endedAt: null,
      durationSec: null,
    });

    return this.timeLogsRepo.save(log);
  }

  async stopTimer(taskId: string, userId: string): Promise<TimeLog> {
    const active = await this.timeLogsRepo.findOne({
      where: { taskId, userId, endedAt: IsNull() },
    });
    if (!active) {
      throw new BadRequestException('No active timer for this task');
    }

    const endedAt = new Date();
    const durationSec = Math.floor(
      (endedAt.getTime() - active.startedAt.getTime()) / 1000,
    );

    active.endedAt = endedAt;
    active.durationSec = durationSec;

    return this.timeLogsRepo.save(active);
  }

  async getTimeLogs(taskId: string): Promise<TimeLog[]> {
    return this.timeLogsRepo.find({
      where: { taskId },
      relations: { user: true },
      order: { startedAt: 'DESC' },
    });
  }

  // ─── AI саммари (вызывается из AiModule) ─────────────────────────

  async getTaskWithContext(taskId: string): Promise<Task> {
    return this.tasksRepo.findOneOrFail({
      where: { id: taskId },
      relations: { assignee: true, creator: true },
    });
  }

  async updateAiSummary(taskId: string, summary: string): Promise<void> {
    await this.tasksRepo.update(taskId, { aiSummary: summary });
  }
}
