import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsInt, Min } from 'class-validator';

export class CreateColumnDto {
  @ApiProperty({ example: 'In Progress' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 0, description: 'Position index, 0-based' })
  @IsInt()
  @Min(0)
  position: number;
}
