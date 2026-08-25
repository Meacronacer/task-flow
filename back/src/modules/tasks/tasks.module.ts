import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TimeLog } from './entities/time-log.entity';
import { BoardColumn } from '../columns/entities/column.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TimeLog, BoardColumn]),
    ProjectsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
