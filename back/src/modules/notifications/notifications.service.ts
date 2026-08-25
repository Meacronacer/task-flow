import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { EventsGateway } from '../../gateway/events.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkDeadlines(): Promise<void> {
    this.logger.log('Running deadline check...');

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await this.tasksRepo.find({
      where: {
        deadline: LessThanOrEqual(in24h),
        status: Not(TaskStatus.DONE),
      },
    });

    const upcoming = tasks.filter(
      (t) => t.deadline !== null && t.deadline.getTime() > now.getTime(),
    );

    this.logger.log(`Found ${upcoming.length} tasks with upcoming deadlines`);

    for (const task of upcoming) {
      this.eventsGateway.emitToProject(task.projectId, 'deadline.alert', {
        taskId: task.id,
        taskTitle: task.title,
        deadline: task.deadline as Date,
      });
    }
  }
}
