import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { EventsGateway } from '../../gateway/events.gateway';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';

const makeComment = (overrides: Partial<Comment> = {}): Comment =>
  ({
    id: 'comment-1',
    taskId: 'task-1',
    userId: 'user-1',
    content: 'Great work!',
    createdAt: new Date(),
    user: { id: 'user-1', name: 'Alice' },
    ...overrides,
  }) as Comment;

describe('CommentsService', () => {
  let service: CommentsService;
  let commentsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    remove: jest.Mock;
  };
  let eventsGateway: { emitToProject: jest.Mock };
  let projectsService: { logActivity: jest.Mock };
  let tasksService: {
    findOne: jest.Mock;
    updateAiSummary: jest.Mock;
  };

  beforeEach(async () => {
    commentsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      remove: jest.fn(),
    };
    eventsGateway = { emitToProject: jest.fn() };
    projectsService = { logActivity: jest.fn().mockResolvedValue(undefined) };
    tasksService = {
      findOne: jest.fn(),
      updateAiSummary: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: commentsRepo },
        { provide: EventsGateway, useValue: eventsGateway },
        { provide: ProjectsService, useValue: projectsService },
        { provide: TasksService, useValue: tasksService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  describe('create', () => {
    it('should create comment and emit WS event', async () => {
      tasksService.findOne.mockResolvedValue({
        id: 'task-1',
        projectId: 'proj-1',
      });

      const comment = makeComment();
      commentsRepo.create.mockReturnValue(comment);
      commentsRepo.save.mockResolvedValue(comment);
      commentsRepo.findOneOrFail.mockResolvedValue(comment);

      const result = await service.create('task-1', 'proj-1', 'user-1', {
        content: 'Great work!',
      });

      expect(result).toEqual(comment);
      expect(tasksService.updateAiSummary).toHaveBeenCalledWith('task-1', null);
      expect(eventsGateway.emitToProject).toHaveBeenCalledWith(
        'proj-1',
        'comment.added',
        expect.objectContaining({ taskId: 'task-1', authorId: 'user-1' }),
      );
    });

    it('should throw NotFoundException if task not in project', async () => {
      tasksService.findOne.mockResolvedValue({
        id: 'task-1',
        projectId: 'other-proj',
      });

      await expect(
        service.create('task-1', 'proj-1', 'user-1', { content: 'Hello' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return comments ordered by createdAt', async () => {
      const comments = [makeComment(), makeComment({ id: 'comment-2' })];
      commentsRepo.find.mockResolvedValue(comments);

      const result = await service.findAll('task-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update comment when user is author', async () => {
      const comment = makeComment({ userId: 'user-1' });
      commentsRepo.findOne.mockResolvedValue(comment);
      commentsRepo.save.mockImplementation((c: Comment) => Promise.resolve(c));

      const result = await service.update('comment-1', 'user-1', {
        content: 'Updated!',
      });

      expect(result.content).toBe('Updated!');
    });

    it('should throw ForbiddenException when non-author tries to update', async () => {
      commentsRepo.findOne.mockResolvedValue(makeComment({ userId: 'user-1' }));

      await expect(
        service.update('comment-1', 'user-99', { content: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when comment not found', async () => {
      commentsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('none', 'user-1', { content: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove comment when user is author', async () => {
      commentsRepo.findOne.mockResolvedValue(makeComment({ userId: 'user-1' }));
      commentsRepo.remove.mockResolvedValue(undefined);

      await expect(
        service.remove('comment-1', 'user-1'),
      ).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when non-author tries to delete', async () => {
      commentsRepo.findOne.mockResolvedValue(makeComment({ userId: 'user-1' }));

      await expect(service.remove('comment-1', 'user-99')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
