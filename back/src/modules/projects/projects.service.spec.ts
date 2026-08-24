import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectMember, ProjectRole } from './entities/project-member.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { UsersService } from '../users/users.service';

const makeProject = (overrides: Partial<Project> = {}): Project =>
  ({
    id: 'proj-1',
    name: 'Test Project',
    description: null,
    ownerId: 'user-1',
    createdAt: new Date(),
    ...overrides,
  }) as Project;

const makeMember = (overrides: Partial<ProjectMember> = {}): ProjectMember =>
  ({
    id: 'member-1',
    projectId: 'proj-1',
    userId: 'user-1',
    role: ProjectRole.OWNER,
    joinedAt: new Date(),
    ...overrides,
  }) as ProjectMember;

type MockRepo<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const mockRepo = <T extends ObjectLiteral>(): MockRepo<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepo: MockRepo<Project>;
  let membersRepo: MockRepo<ProjectMember>;
  let activityRepo: MockRepo<ActivityLog>;
  let usersService: { findByEmail: jest.Mock };

  beforeEach(async () => {
    projectsRepo = mockRepo<Project>();
    membersRepo = mockRepo<ProjectMember>();
    activityRepo = mockRepo<ActivityLog>();
    usersService = { findByEmail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: projectsRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: membersRepo },
        { provide: getRepositoryToken(ActivityLog), useValue: activityRepo },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('should create project and add owner as member', async () => {
      const project = makeProject();
      projectsRepo.create!.mockReturnValue(project);
      projectsRepo.save!.mockResolvedValue(project);

      const ownerMember = makeMember();
      membersRepo.create!.mockReturnValue(ownerMember);
      membersRepo.save!.mockResolvedValue(ownerMember);

      activityRepo.create!.mockReturnValue({});
      activityRepo.save!.mockResolvedValue({});

      const result = await service.create('user-1', { name: 'Test Project' });

      expect(projectsRepo.create).toHaveBeenCalledWith({
        name: 'Test Project',
        description: null,
        ownerId: 'user-1',
      });
      expect(membersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: ProjectRole.OWNER, userId: 'user-1' }),
      );
      expect(result).toEqual(project);
    });
  });

  describe('findOne', () => {
    it('should return project with relations', async () => {
      const project = makeProject();
      projectsRepo.findOne!.mockResolvedValue(project);

      const result = await service.findOne('proj-1');
      expect(result).toEqual(project);
    });

    it('should throw NotFoundException if project not found', async () => {
      projectsRepo.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update project name when requester is owner', async () => {
      const project = makeProject();
      projectsRepo.findOne!.mockResolvedValue(project);
      membersRepo.findOne!.mockResolvedValue(
        makeMember({ role: ProjectRole.OWNER }),
      );
      projectsRepo.save!.mockResolvedValue({ ...project, name: 'Updated' });
      activityRepo.create!.mockReturnValue({});
      activityRepo.save!.mockResolvedValue({});

      const result = await service.update('proj-1', 'user-1', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });

    it('should throw ForbiddenException when requester is plain member', async () => {
      const project = makeProject();
      projectsRepo.findOne!.mockResolvedValue(project);
      membersRepo.findOne!.mockResolvedValue(
        makeMember({ role: ProjectRole.MEMBER }),
      );

      await expect(
        service.update('proj-1', 'user-2', { name: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete project when requester is owner', async () => {
      const project = makeProject({ ownerId: 'user-1' });
      projectsRepo.findOne!.mockResolvedValue(project);
      projectsRepo.remove!.mockResolvedValue(undefined);

      await expect(service.remove('proj-1', 'user-1')).resolves.toBeUndefined();
      expect(projectsRepo.remove).toHaveBeenCalledWith(project);
    });

    it('should throw ForbiddenException when non-owner tries to delete', async () => {
      const project = makeProject({ ownerId: 'user-1' });
      projectsRepo.findOne!.mockResolvedValue(project);

      await expect(service.remove('proj-1', 'user-99')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('inviteMember', () => {
    it('should invite user by email', async () => {
      membersRepo
        .findOne!.mockResolvedValueOnce(makeMember({ role: ProjectRole.OWNER })) // requester check
        .mockResolvedValueOnce(null); // existing member check

      usersService.findByEmail.mockResolvedValue({
        id: 'user-2',
        email: 'new@test.com',
      });

      const newMember = makeMember({
        userId: 'user-2',
        role: ProjectRole.MEMBER,
      });
      membersRepo.create!.mockReturnValue(newMember);
      membersRepo.save!.mockResolvedValue(newMember);
      membersRepo.findOneOrFail!.mockResolvedValue({ ...newMember, user: {} });
      activityRepo.create!.mockReturnValue({});
      activityRepo.save!.mockResolvedValue({});

      const result = await service.inviteMember('proj-1', 'user-1', {
        email: 'new@test.com',
      });

      expect(result.userId).toBe('user-2');
    });

    it('should throw NotFoundException if invitee email not found', async () => {
      membersRepo.findOne!.mockResolvedValue(
        makeMember({ role: ProjectRole.OWNER }),
      );
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.inviteMember('proj-1', 'user-1', { email: 'ghost@test.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already a member', async () => {
      membersRepo
        .findOne!.mockResolvedValueOnce(makeMember({ role: ProjectRole.OWNER }))
        .mockResolvedValueOnce(makeMember({ userId: 'user-2' })); // already exists

      usersService.findByEmail.mockResolvedValue({
        id: 'user-2',
        email: 'existing@test.com',
      });

      await expect(
        service.inviteMember('proj-1', 'user-1', {
          email: 'existing@test.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('should allow owner to remove a member', async () => {
      projectsRepo.findOne!.mockResolvedValue(makeProject());
      membersRepo
        .findOne!.mockResolvedValueOnce(
          makeMember({ role: ProjectRole.OWNER, userId: 'user-1' }),
        )
        .mockResolvedValueOnce(
          makeMember({ role: ProjectRole.MEMBER, userId: 'user-2' }),
        );
      membersRepo.remove!.mockResolvedValue(undefined);
      activityRepo.create!.mockReturnValue({});
      activityRepo.save!.mockResolvedValue({});

      await expect(
        service.removeMember('proj-1', 'user-2', 'user-1'),
      ).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when trying to remove the owner', async () => {
      projectsRepo.findOne!.mockResolvedValue(makeProject());
      membersRepo
        .findOne!.mockResolvedValueOnce(
          makeMember({ role: ProjectRole.OWNER, userId: 'user-1' }),
        )
        .mockResolvedValueOnce(
          makeMember({ role: ProjectRole.OWNER, userId: 'user-1' }),
        );

      await expect(
        service.removeMember('proj-1', 'user-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow member to leave the project themselves', async () => {
      projectsRepo.findOne!.mockResolvedValue(makeProject());
      membersRepo
        .findOne!.mockResolvedValueOnce(
          makeMember({ role: ProjectRole.MEMBER, userId: 'user-2' }),
        )
        .mockResolvedValueOnce(
          makeMember({ role: ProjectRole.MEMBER, userId: 'user-2' }),
        );
      membersRepo.remove!.mockResolvedValue(undefined);
      activityRepo.create!.mockReturnValue({});
      activityRepo.save!.mockResolvedValue({});

      await expect(
        service.removeMember('proj-1', 'user-2', 'user-2'),
      ).resolves.toBeUndefined();
    });
  });
});
