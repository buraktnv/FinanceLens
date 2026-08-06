import { Currency, IncomeType, Frequency } from '@prisma/client';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncomeDto {
  @ApiProperty({ example: 5000, description: 'Income amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    enum: Currency,
    enumName: 'Currency',
    default: Currency.USD,
    description: 'Currency of the amount',
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({
    enum: IncomeType,
    enumName: 'IncomeType',
    description: 'Source of income',
  })
  @IsEnum(IncomeType)
  type: IncomeType;

  @ApiPropertyOptional({ example: 'Monthly salary' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2024-03-01',
    description: 'Date the income was received',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the income recurs on a schedule',
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: Frequency,
    enumName: 'Frequency',
    description: 'Recurrence frequency (when isRecurring is true)',
  })
  @IsOptional()
  @IsEnum(Frequency)
  frequency?: Frequency;

  @ApiPropertyOptional({
    example: 'property-uuid',
    description: 'Related property identifier',
  })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ example: 'Includes bonus' })
  @IsOptional()
  @IsString()
  notes?: string;
}
