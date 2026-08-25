import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { GatewayModule } from '../../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    ProjectsModule,
    TasksModule,
    GatewayModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
