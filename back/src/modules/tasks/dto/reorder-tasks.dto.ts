import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskPositionDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position: number;
}

export class ReorderTasksDto {
  @ApiProperty({ type: [TaskPositionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskPositionDto)
  tasks: TaskPositionDto[];
}
