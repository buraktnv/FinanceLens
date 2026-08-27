import { IncomeType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindIncomesQueryDto {
  @ApiPropertyOptional({
    enum: IncomeType,
    enumName: 'IncomeType',
    description: 'Filter by income type',
  })
  @IsOptional()
  @IsEnum(IncomeType)
  type?: IncomeType;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Only incomes on or after this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Only incomes on or before this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
