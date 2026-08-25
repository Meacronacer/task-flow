import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnPositionDto {
  @ApiProperty({ example: 'uuid-of-column' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  position: number;
}

export class ReorderColumnsDto {
  @ApiProperty({ type: [ColumnPositionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnPositionDto)
  columns: ColumnPositionDto[];
}
