import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../projects/guards/project-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';

interface CurrentUserPayload {
  id: string;
  email: string;
}

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create task' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.create(projectId, user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all tasks for project (optionally filter by column)',
  })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'columnId', required: false, type: 'string' })
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('columnId') columnId?: string,
  ) {
    return this.tasksService.findAll(projectId, columnId);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get task by id' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  findOne(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.tasksService.findOne(taskId);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update task fields' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  update(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.update(taskId, user.id, dto);
  }

  @Patch(':taskId/move')
  @ApiOperation({ summary: 'Move task to another column (drag & drop)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  move(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: MoveTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.move(taskId, user.id, dto);
  }

  @Patch('reorder/:columnId')
  @ApiOperation({ summary: 'Reorder tasks within a column' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'columnId', type: 'string', format: 'uuid' })
  reorder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() dto: ReorderTasksDto,
  ) {
    return this.tasksService.reorder(projectId, columnId, dto);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  async remove(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.tasksService.remove(taskId, user.id);
  }

  // ─── Time Tracker ─────────────────────────────────────────────────

  @Post(':taskId/timer/start')
  @ApiOperation({ summary: 'Start time tracker for task' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  startTimer(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.startTimer(taskId, user.id);
  }

  @Post(':taskId/timer/stop')
  @ApiOperation({ summary: 'Stop time tracker for task' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  stopTimer(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tasksService.stopTimer(taskId, user.id);
  }

  @Get(':taskId/timer')
  @ApiOperation({ summary: 'Get time logs for task' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  getTimeLogs(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.tasksService.getTimeLogs(taskId);
  }
}
