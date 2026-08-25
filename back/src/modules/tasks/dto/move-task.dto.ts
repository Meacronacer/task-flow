import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min } from 'class-validator';

export class MoveTaskDto {
  @ApiProperty({ example: 'uuid-of-target-column' })
  @IsUUID()
  columnId: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  position: number;
}
