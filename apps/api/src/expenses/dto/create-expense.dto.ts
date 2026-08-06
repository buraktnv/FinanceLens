import {
  Currency,
  ExpenseCategory,
  Frequency,
  PaymentMethod,
} from '@prisma/client';
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

export class CreateExpenseDto {
  @ApiProperty({ example: 150.0, description: 'Expense amount' })
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
    enum: ExpenseCategory,
    enumName: 'ExpenseCategory',
    description: 'Spending category',
  })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiPropertyOptional({ example: 'Weekly groceries' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2024-03-05',
    description: 'Date the expense was incurred',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the expense recurs on a schedule',
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
    enum: PaymentMethod,
    enumName: 'PaymentMethod',
    description: 'How the expense was paid',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    example: 'property-uuid',
    description: 'Related property identifier',
  })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ example: 'Paid in cash' })
  @IsOptional()
  @IsString()
  notes?: string;
}
