import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { TaskPriority } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login page' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Use React Hook Form + Zod' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-of-column' })
  @IsUUID()
  columnId: string;

  @ApiPropertyOptional({ example: 'uuid-of-user' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  position: number;
}
