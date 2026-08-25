import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Looks good, but needs more tests.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
