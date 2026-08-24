import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { ProjectRoles } from './decorators/project-roles.decorator';
import { ProjectRole } from './entities/project-member.entity';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

interface CurrentUserPayload {
  id: string;
  email: string;
}

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ─── Projects ─────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for current user' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.projectsService.findAllForUser(user.id);
  }

  @Get(':id')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Get project by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Update project (owner/admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles(ProjectRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project (owner only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.projectsService.remove(id, user.id);
  }

  // ─── Members ──────────────────────────────────────────────────────

  @Get(':projectId/members')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Get project members' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  getMembers(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectsService.getMembers(projectId);
  }

  @Post(':projectId/members')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Invite a member by email (owner/admin only)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  inviteMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.inviteMember(projectId, user.id, dto);
  }

  @Patch(':projectId/members/:userId/role')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Update member role (owner/admin only)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  updateMemberRole(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.projectsService.updateMemberRole(
      projectId,
      userId,
      user.id,
      dto,
    );
  }

  @Delete(':projectId/members/:userId')
  @UseGuards(ProjectMemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member or leave project' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  async removeMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.projectsService.removeMember(projectId, userId, user.id);
  }

  // ─── Activity Log ─────────────────────────────────────────────────

  @Get(':projectId/activity')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Get project activity log' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  getActivityLog(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectsService.getActivityLog(projectId);
  }
}
