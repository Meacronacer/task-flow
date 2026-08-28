import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, ActivityLog]),
    UsersModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectMemberGuard],
  exports: [ProjectsService, ProjectMemberGuard, TypeOrmModule],
})
export class ProjectsModule {}
