import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../projects/guards/project-member.guard';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/tasks')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(':taskId/summarize')
  @ApiOperation({ summary: 'Generate or return cached AI summary for a task' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'taskId', type: 'string', format: 'uuid' })
  async summarize(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    const summary = await this.aiService.summarizeTask(taskId, projectId);
    return { summary };
  }
}
