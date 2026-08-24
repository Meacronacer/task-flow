import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'TaskFlow v2' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Main project board' })
  @IsString()
  @IsOptional()
  description?: string;
}
