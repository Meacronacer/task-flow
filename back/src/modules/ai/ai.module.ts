import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TasksModule } from '../tasks/tasks.module';
import { CommentsModule } from '../comments/comments.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TasksModule, CommentsModule, ProjectsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
