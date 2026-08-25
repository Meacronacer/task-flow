import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';
import { TimeLog } from './entities/time-log.entity';
import { BoardColumn } from '../columns/entities/column.entity';
import { ProjectsService } from '../projects/projects.service';
import { EventsGateway } from '../../gateway/events.gateway';

const makeTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: 'task-1',
    columnId: 'col-1',
    projectId: 'proj-1',
    title: 'Fix bug',
    description: null,
    assigneeId: null,
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    position: 0,
    deadline: null,
    aiSummary: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Task;

const makeTimeLog = (overrides: Partial<TimeLog> = {}): TimeLog =>
  ({
    id: 'log-1',
    taskId: 'task-1',
    userId: 'user-1',
    startedAt: new Date(),
    endedAt: null,
    durationSec: null,
    ...overrides,
  }) as TimeLog;

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    remove: jest.Mock;
    update: jest.Mock;
  };
  let timeLogsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let columnsRepo: { findOne: jest.Mock };
  let projectsService: { logActivity: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    tasksRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };
    timeLogsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    columnsRepo = { findOne: jest.fn() };
    projectsService = { logActivity: jest.fn().mockResolvedValue(undefined) };
    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (m: unknown) => Promise<void>) =>
          cb({ update: jest.fn().mockResolvedValue(undefined) }),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: getRepositoryToken(TimeLog), useValue: timeLogsRepo },
        { provide: getRepositoryToken(BoardColumn), useValue: columnsRepo },
        { provide: ProjectsService, useValue: projectsService },
        { provide: DataSource, useValue: dataSource },
        {
          provide: EventsGateway,
          useValue: {
            emitToProject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create task when column belongs to project', async () => {
      columnsRepo.findOne.mockResolvedValue({
        id: 'col-1',
        projectId: 'proj-1',
      });
      const task = makeTask();
      tasksRepo.create.mockReturnValue(task);
      tasksRepo.save.mockResolvedValue(task);

      const result = await service.create('proj-1', 'user-1', {
        title: 'Fix bug',
        columnId: 'col-1',
        position: 0,
      });

      expect(result).toEqual(task);
    });

    it('should throw NotFoundException if column not in project', async () => {
      columnsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('proj-1', 'user-1', {
          title: 'Fix bug',
          columnId: 'wrong-col',
          position: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return task with relations', async () => {
      const task = makeTask();
      tasksRepo.findOne.mockResolvedValue(task);

      expect(await service.findOne('task-1')).toEqual(task);
    });

    it('should throw NotFoundException when not found', async () => {
      tasksRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('none')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should nullify aiSummary when status changes', async () => {
      const task = makeTask({ status: TaskStatus.TODO, aiSummary: 'cached' });
      tasksRepo.findOne.mockResolvedValue(task);
      tasksRepo.save.mockImplementation((t: Task) => Promise.resolve(t));

      const result = await service.update('task-1', 'user-1', {
        status: TaskStatus.IN_PROGRESS,
      });

      expect(result.aiSummary).toBeNull();
    });

    it('should not nullify aiSummary when status does not change', async () => {
      const task = makeTask({ status: TaskStatus.TODO, aiSummary: 'cached' });
      tasksRepo.findOne.mockResolvedValue(task);
      tasksRepo.save.mockImplementation((t: Task) => Promise.resolve(t));

      const result = await service.update('task-1', 'user-1', {
        title: 'New title',
      });

      expect(result.aiSummary).toBe('cached');
    });
  });

  describe('move', () => {
    it('should move task to another column', async () => {
      const task = makeTask({ columnId: 'col-1' });
      tasksRepo.findOne.mockResolvedValue(task);
      columnsRepo.findOne.mockResolvedValue({
        id: 'col-2',
        projectId: 'proj-1',
      });
      tasksRepo.save.mockImplementation((t: Task) => Promise.resolve(t));

      const result = await service.move('task-1', 'user-1', {
        columnId: 'col-2',
        position: 1,
      });

      expect(result.columnId).toBe('col-2');
      expect(result.position).toBe(1);
    });

    it('should throw NotFoundException if target column not in project', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask());
      columnsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.move('task-1', 'user-1', {
          columnId: 'alien-col',
          position: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startTimer', () => {
    it('should start timer when no active log', async () => {
      timeLogsRepo.findOne.mockResolvedValue(null);
      const log = makeTimeLog();
      timeLogsRepo.create.mockReturnValue(log);
      timeLogsRepo.save.mockResolvedValue(log);

      const result = await service.startTimer('task-1', 'user-1');
      expect(result.endedAt).toBeNull();
    });

    it('should throw BadRequestException if timer already running', async () => {
      timeLogsRepo.findOne.mockResolvedValue(makeTimeLog());

      await expect(service.startTimer('task-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('stopTimer', () => {
    it('should stop timer and calculate duration', async () => {
      const started = new Date(Date.now() - 60_000); // 60 секунд назад
      const log = makeTimeLog({ startedAt: started });
      timeLogsRepo.findOne.mockResolvedValue(log);
      timeLogsRepo.save.mockImplementation((l: TimeLog) => Promise.resolve(l));

      const result = await service.stopTimer('task-1', 'user-1');

      expect(result.endedAt).not.toBeNull();
      expect(result.durationSec).toBeGreaterThanOrEqual(60);
    });

    it('should throw BadRequestException if no active timer', async () => {
      timeLogsRepo.findOne.mockResolvedValue(null);

      await expect(service.stopTimer('task-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
