import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../entities/task.entity';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-of-user' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  deadline?: string;
}
