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
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';

interface CurrentUserPayload {
  id: string;
  email: string;
}

@ApiTags('columns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@Controller('projects/:projectId/columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  @ApiOperation({ summary: 'Create column (owner/admin only)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateColumnDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.columnsService.create(projectId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all columns for project' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  findAll(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.columnsService.findAll(projectId);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder columns (owner/admin only)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  reorder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: ReorderColumnsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.columnsService.reorder(projectId, user.id, dto);
  }

  @Patch(':columnId')
  @ApiOperation({ summary: 'Update column (owner/admin only)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'columnId', type: 'string', format: 'uuid' })
  update(
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() dto: UpdateColumnDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.columnsService.update(columnId, user.id, dto);
  }

  @Delete(':columnId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete column (owner/admin only)' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'columnId', type: 'string', format: 'uuid' })
  async remove(
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.columnsService.remove(columnId, user.id);
  }
}
