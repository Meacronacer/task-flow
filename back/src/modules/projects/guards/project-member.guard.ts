import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '../entities/project-member.entity';
import { Project } from '../entities/project.entity';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/project-roles.decorator';
import type { Request } from 'express';

// Расширяем тип Request чтобы TypeScript знал о наших полях
interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
  params: { projectId?: string; id?: string } & Record<string, string>;
  projectMember?: ProjectMember;
}

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(ProjectMember)
    private membersRepo: Repository<ProjectMember>,
    @InjectRepository(Project)
    private projectsRepo: Repository<Project>,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = req.user.id;

    const projectId = req.params.projectId ?? req.params.id;

    if (!projectId) {
      return true;
    }

    const project = await this.projectsRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.membersRepo.findOne({
      where: { projectId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(member.role)) {
        throw new ForbiddenException('Insufficient project permissions');
      }
    }

    req.projectMember = member;

    return true;
  }
}
