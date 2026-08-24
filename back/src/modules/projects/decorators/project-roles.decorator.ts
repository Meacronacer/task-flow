import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '../entities/project-member.entity';

export const ROLES_KEY = 'projectRoles';
export const ProjectRoles = (...roles: ProjectRole[]) =>
  SetMetadata(ROLES_KEY, roles);
