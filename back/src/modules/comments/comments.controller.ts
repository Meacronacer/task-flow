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
import { ProjectMemberGuard } from '../projects/guards/project-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

interface CurrentUserPayload {
  id: string;
  email: string;
}

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add comment to task' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.create(taskId, projectId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for task' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  findAll(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.commentsService.findAll(taskId);
  }

  @Patch(':commentId')
  @ApiOperation({ summary: 'Update comment (author only)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'commentId', type: 'string', format: 'uuid' })
  update(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.update(commentId, user.id, dto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment (author only)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'commentId', type: 'string', format: 'uuid' })
  async remove(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.commentsService.remove(commentId, user.id);
  }
}
