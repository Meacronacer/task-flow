import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { BoardColumn } from './entities/column.entity';
import { ProjectsService } from '../projects/projects.service';
import { ProjectRole } from '../projects/entities/project-member.entity';

const makeColumn = (overrides: Partial<BoardColumn> = {}): BoardColumn =>
  ({
    id: 'col-1',
    projectId: 'proj-1',
    title: 'To Do',
    position: 0,
    createdAt: new Date(),
    ...overrides,
  }) as BoardColumn;

describe('ColumnsService', () => {
  let service: ColumnsService;
  let columnsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let projectsService: { getMembers: jest.Mock; logActivity: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    columnsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    projectsService = {
      getMembers: jest.fn(),
      logActivity: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (m: unknown) => Promise<void>) =>
          cb({ update: jest.fn().mockResolvedValue(undefined) }),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColumnsService,
        { provide: getRepositoryToken(BoardColumn), useValue: columnsRepo },
        { provide: ProjectsService, useValue: projectsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ColumnsService>(ColumnsService);
  });

  describe('create', () => {
    it('should create column when user is owner', async () => {
      projectsService.getMembers.mockResolvedValue([
        { userId: 'user-1', role: ProjectRole.OWNER },
      ]);
      const column = makeColumn();
      columnsRepo.create.mockReturnValue(column);
      columnsRepo.save.mockResolvedValue(column);

      const result = await service.create('proj-1', 'user-1', {
        title: 'To Do',
        position: 0,
      });

      expect(result).toEqual(column);
      expect(columnsRepo.create).toHaveBeenCalledWith({
        projectId: 'proj-1',
        title: 'To Do',
        position: 0,
      });
    });

    it('should throw ForbiddenException when user is plain member', async () => {
      projectsService.getMembers.mockResolvedValue([
        { userId: 'user-1', role: ProjectRole.MEMBER },
      ]);

      await expect(
        service.create('proj-1', 'user-1', { title: 'To Do', position: 0 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return column by id', async () => {
      const column = makeColumn();
      columnsRepo.findOne.mockResolvedValue(column);

      expect(await service.findOne('col-1')).toEqual(column);
    });

    it('should throw NotFoundException if not found', async () => {
      columnsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('none')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove column when user is admin', async () => {
      columnsRepo.findOne.mockResolvedValue(makeColumn());
      projectsService.getMembers.mockResolvedValue([
        { userId: 'user-1', role: ProjectRole.ADMIN },
      ]);
      columnsRepo.remove.mockResolvedValue(undefined);

      await expect(service.remove('col-1', 'user-1')).resolves.toBeUndefined();
    });
  });

  describe('reorder', () => {
    it('should call transaction and return updated columns', async () => {
      projectsService.getMembers.mockResolvedValue([
        { userId: 'user-1', role: ProjectRole.OWNER },
      ]);
      columnsRepo.find.mockResolvedValue([makeColumn()]);

      const result = await service.reorder('proj-1', 'user-1', {
        columns: [{ id: 'col-1', position: 1 }],
      });

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
