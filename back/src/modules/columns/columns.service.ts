import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BoardColumn } from './entities/column.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { ProjectsService } from '../projects/projects.service';
import { ProjectRole } from '../projects/entities/project-member.entity';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(BoardColumn)
    private columnsRepo: Repository<BoardColumn>,
    private projectsService: ProjectsService,
    private dataSource: DataSource,
  ) {}

  async create(
    projectId: string,
    userId: string,
    dto: CreateColumnDto,
  ): Promise<BoardColumn> {
    await this.requireOwnerOrAdmin(projectId, userId);

    const column = this.columnsRepo.create({
      projectId,
      title: dto.title,
      position: dto.position,
    });
    const saved = await this.columnsRepo.save(column);

    await this.projectsService.logActivity(
      projectId,
      userId,
      'column.created',
      {
        columnId: saved.id,
        title: saved.title,
      },
    );

    return saved;
  }

  async findAll(projectId: string): Promise<BoardColumn[]> {
    return this.columnsRepo.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
  }

  async findOne(columnId: string): Promise<BoardColumn> {
    const column = await this.columnsRepo.findOne({
      where: { id: columnId },
    });
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    return column;
  }

  async update(
    columnId: string,
    userId: string,
    dto: UpdateColumnDto,
  ): Promise<BoardColumn> {
    const column = await this.findOne(columnId);
    await this.requireOwnerOrAdmin(column.projectId, userId);

    if (dto.title !== undefined) column.title = dto.title;
    if (dto.position !== undefined) column.position = dto.position;

    const saved = await this.columnsRepo.save(column);

    await this.projectsService.logActivity(
      column.projectId,
      userId,
      'column.updated',
      { columnId, fields: Object.keys(dto) },
    );

    return saved;
  }

  async remove(columnId: string, userId: string): Promise<void> {
    const column = await this.findOne(columnId);
    await this.requireOwnerOrAdmin(column.projectId, userId);

    await this.columnsRepo.remove(column);

    await this.projectsService.logActivity(
      column.projectId,
      userId,
      'column.deleted',
      { columnId, title: column.title },
    );
  }

  async reorder(
    projectId: string,
    userId: string,
    dto: ReorderColumnsDto,
  ): Promise<BoardColumn[]> {
    await this.requireOwnerOrAdmin(projectId, userId);

    // using transaction
    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.columns) {
        await manager.update(
          BoardColumn,
          { id: item.id, projectId },
          { position: item.position },
        );
      }
    });

    return this.findAll(projectId);
  }

  // ─── Helper ───────────────────────────────────────────────────────

  private async requireOwnerOrAdmin(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const members = await this.projectsService.getMembers(projectId);
    const member = members.find((m) => m.userId === userId);

    if (
      !member ||
      (member.role !== ProjectRole.OWNER && member.role !== ProjectRole.ADMIN)
    ) {
      throw new ForbiddenException('Only owner or admin can manage columns');
    }
  }
}
