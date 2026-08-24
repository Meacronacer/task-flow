import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember, ProjectRole } from './entities/project-member.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UsersService } from '../users/users.service';
import type { ProjectWithRole } from './types';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,

    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,

    private readonly usersService: UsersService,
  ) {}

  // ─── Projects CRUD ────────────────────────────────────────────────

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      ownerId: userId,
    });

    const saved = await this.projectsRepo.save(project);

    // creator become a owner
    const member = this.membersRepo.create({
      projectId: saved.id,
      userId,
      role: ProjectRole.OWNER,
    });

    await this.membersRepo.save(member);

    await this.logActivity(saved.id, userId, 'project.created', {
      projectName: saved.name,
    });

    return saved;
  }

  async findAllForUser(userId: string): Promise<ProjectWithRole[]> {
    const rows = await this.projectsRepo
      .createQueryBuilder('p')
      .innerJoin('p.members', 'm', 'm.user_id = :userId', { userId })
      .addSelect('m.role', 'role')
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)', 'cnt')
            .from(ProjectMember, 'pm')
            .where('pm.project_id = p.id'),
        'memberCount',
      )
      .getRawMany<{
        p_id: string;
        p_name: string;
        p_description: string | null;
        p_owner_id: string;
        p_created_at: Date;
        role: ProjectRole;
        memberCount: string;
      }>();

    return rows.map((row) => ({
      id: row.p_id,
      name: row.p_name,
      description: row.p_description,
      ownerId: row.p_owner_id,
      createdAt: row.p_created_at,
      role: row.role,
      memberCount: Number(row.memberCount),
    }));
  }

  async findOne(projectId: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({
      where: {
        id: projectId,
      },
      relations: {
        owner: true,
        members: {
          user: true,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(projectId);

    await this.requireOwnerOrAdmin(projectId, userId);

    if (dto.name !== undefined) {
      project.name = dto.name;
    }

    if (dto.description !== undefined) {
      project.description = dto.description ?? null;
    }

    const saved = await this.projectsRepo.save(project);

    await this.logActivity(projectId, userId, 'project.updated', {
      fields: Object.keys(dto),
    });

    return saved;
  }

  async remove(projectId: string, userId: string): Promise<void> {
    const project = await this.findOne(projectId);

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can delete it');
    }

    await this.projectsRepo.remove(project);
  }

  // ─── Members ──────────────────────────────────────────────────────

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    return this.membersRepo.find({
      where: {
        projectId,
      },
      relations: {
        user: true,
      },
      order: {
        joinedAt: 'ASC',
      },
    });
  }

  async inviteMember(
    projectId: string,
    inviterId: string,
    dto: InviteMemberDto,
  ): Promise<ProjectMember> {
    await this.requireOwnerOrAdmin(projectId, inviterId);

    const invitee = await this.usersService.findByEmail(dto.email);

    if (!invitee) {
      throw new NotFoundException(`User with email ${dto.email} not found`);
    }

    const existing = await this.membersRepo.findOne({
      where: {
        projectId,
        userId: invitee.id,
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = this.membersRepo.create({
      projectId,
      userId: invitee.id,
      role: dto.role ?? ProjectRole.MEMBER,
    });

    const saved = await this.membersRepo.save(member);

    await this.logActivity(projectId, inviterId, 'member.invited', {
      inviteeId: invitee.id,
      inviteeEmail: invitee.email,
      role: saved.role,
    });

    return this.membersRepo.findOneOrFail({
      where: {
        id: saved.id,
      },
      relations: {
        user: true,
      },
    });
  }

  async updateMemberRole(
    projectId: string,
    targetUserId: string,
    requesterId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<ProjectMember> {
    await this.requireOwnerOrAdmin(projectId, requesterId);

    const member = await this.membersRepo.findOne({
      where: {
        projectId,
        userId: targetUserId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this project');
    }

    if (member.role === ProjectRole.OWNER) {
      throw new ForbiddenException('Cannot change role of the project owner');
    }

    if (dto.role === ProjectRole.OWNER) {
      throw new ForbiddenException(
        'Cannot assign owner role through this endpoint',
      );
    }

    member.role = dto.role;

    const saved = await this.membersRepo.save(member);

    await this.logActivity(projectId, requesterId, 'member.role_updated', {
      targetUserId,
      newRole: dto.role,
    });

    return saved;
  }

  async removeMember(
    projectId: string,
    targetUserId: string,
    requesterId: string,
  ): Promise<void> {
    // Owner can delete anyone except himself
    // Admin can delete only member
    // Member can delete only himself (leave the project)

    const requester = await this.membersRepo.findOne({
      where: {
        projectId,
        userId: requesterId,
      },
    });

    if (!requester) {
      throw new ForbiddenException('Not a member');
    }

    const target = await this.membersRepo.findOne({
      where: {
        projectId,
        userId: targetUserId,
      },
    });

    if (!target) {
      throw new NotFoundException('Member not found');
    }

    if (target.role === ProjectRole.OWNER) {
      throw new ForbiddenException('Cannot remove the project owner');
    }

    const canRemove =
      requester.role === ProjectRole.OWNER ||
      (requester.role === ProjectRole.ADMIN &&
        target.role === ProjectRole.MEMBER) ||
      requesterId === targetUserId;

    if (!canRemove) {
      throw new ForbiddenException(
        'Insufficient permissions to remove this member',
      );
    }

    await this.membersRepo.remove(target);

    await this.logActivity(projectId, requesterId, 'member.removed', {
      removedUserId: targetUserId,
    });
  }

  // ─── Activity Log ────────────────────────────────────────────────

  async getActivityLog(projectId: string, limit = 50): Promise<ActivityLog[]> {
    return this.activityRepo.find({
      where: {
        projectId,
      },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  async logActivity(
    projectId: string,
    userId: string,
    action: string,
    meta: Record<string, unknown> = {},
  ): Promise<void> {
    const entry = this.activityRepo.create({
      projectId,
      userId,
      action,
      meta,
    });

    await this.activityRepo.save(entry);
  }

  private async requireOwnerOrAdmin(
    projectId: string,
    userId: string,
  ): Promise<ProjectMember> {
    const member = await this.membersRepo.findOne({
      where: {
        projectId,
        userId,
      },
    });

    if (
      !member ||
      (member.role !== ProjectRole.OWNER && member.role !== ProjectRole.ADMIN)
    ) {
      throw new ForbiddenException(
        'Only owner or admin can perform this action',
      );
    }

    return member;
  }
}
