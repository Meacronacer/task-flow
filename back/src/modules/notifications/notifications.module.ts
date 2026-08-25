import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { NotificationsService } from './notifications.service';
import { GatewayModule } from '../../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), GatewayModule],
  providers: [NotificationsService],
})
export class NotificationsModule {}
