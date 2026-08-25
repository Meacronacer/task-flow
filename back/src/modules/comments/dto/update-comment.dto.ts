import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment text.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
