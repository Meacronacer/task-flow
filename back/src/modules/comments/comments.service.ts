import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { EventsGateway } from '../../gateway/events.gateway';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepo: Repository<Comment>,
    private eventsGateway: EventsGateway,
    private projectsService: ProjectsService,
    private tasksService: TasksService,
  ) {}

  async create(
    taskId: string,
    projectId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const task = await this.tasksService.findOne(taskId);
    if (task.projectId !== projectId) {
      throw new NotFoundException('Task not found in this project');
    }

    const comment = this.commentsRepo.create({
      taskId,
      userId,
      content: dto.content,
    });
    const saved = await this.commentsRepo.save(comment);

    await this.tasksService.updateAiSummary(taskId, null);

    await this.projectsService.logActivity(projectId, userId, 'comment.added', {
      commentId: saved.id,
      taskId,
    });

    this.eventsGateway.emitToProject(projectId, 'comment.added', {
      commentId: saved.id,
      taskId,
      content: saved.content,
      authorId: userId,
    });

    return this.commentsRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { user: true },
    });
  }

  async findAll(taskId: string): Promise<Comment[]> {
    return this.commentsRepo.find({
      where: { taskId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.findOne(commentId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    return this.commentsRepo.save(comment);
  }

  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.findOne(commentId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepo.remove(comment);
  }

  private async findOne(commentId: string): Promise<Comment> {
    const comment = await this.commentsRepo.findOne({
      where: { id: commentId },
      relations: { user: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }
}
