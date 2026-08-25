import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Task, TaskStatus, TaskPriority } from '../tasks/entities/task.entity';
import { EventsGateway } from '../../gateway/events.gateway';

const makeTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Fix login bug',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // after 12 hours
    columnId: 'col-1',
    position: 0,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
    assigneeId: null,
    aiSummary: null,
    ...overrides,
  }) as Task;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let tasksRepo: { find: jest.Mock };
  let eventsGateway: { emitToProject: jest.Mock };

  beforeEach(async () => {
    tasksRepo = { find: jest.fn() };
    eventsGateway = { emitToProject: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: EventsGateway, useValue: eventsGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('checkDeadlines', () => {
    it('should emit deadline.alert for tasks due within 24 hours', async () => {
      const task = makeTask();
      tasksRepo.find.mockResolvedValue([task]);

      await service.checkDeadlines();

      expect(eventsGateway.emitToProject).toHaveBeenCalledTimes(1);
      expect(eventsGateway.emitToProject).toHaveBeenCalledWith(
        'proj-1',
        'deadline.alert',
        expect.objectContaining({
          taskId: 'task-1',
          taskTitle: 'Fix login bug',
        }),
      );
    });

    it('should not emit for tasks with deadline already passed', async () => {
      const overdueTask = makeTask({
        deadline: new Date(Date.now() - 60 * 60 * 1000), // час назад
      });
      tasksRepo.find.mockResolvedValue([overdueTask]);

      await service.checkDeadlines();

      expect(eventsGateway.emitToProject).not.toHaveBeenCalled();
    });

    it('should not emit when no tasks found', async () => {
      tasksRepo.find.mockResolvedValue([]);

      await service.checkDeadlines();

      expect(eventsGateway.emitToProject).not.toHaveBeenCalled();
    });

    it('should emit for multiple tasks across different projects', async () => {
      const tasks = [
        makeTask({ id: 'task-1', projectId: 'proj-1' }),
        makeTask({ id: 'task-2', projectId: 'proj-2' }),
      ];
      tasksRepo.find.mockResolvedValue(tasks);

      await service.checkDeadlines();

      expect(eventsGateway.emitToProject).toHaveBeenCalledTimes(2);
      expect(eventsGateway.emitToProject).toHaveBeenCalledWith(
        'proj-1',
        'deadline.alert',
        expect.objectContaining({ taskId: 'task-1' }),
      );
      expect(eventsGateway.emitToProject).toHaveBeenCalledWith(
        'proj-2',
        'deadline.alert',
        expect.objectContaining({ taskId: 'task-2' }),
      );
    });

    it('should skip tasks with null deadline', async () => {
      const taskWithoutDeadline = makeTask({ deadline: null });
      tasksRepo.find.mockResolvedValue([taskWithoutDeadline]);

      await service.checkDeadlines();

      expect(eventsGateway.emitToProject).not.toHaveBeenCalled();
    });
  });
});
