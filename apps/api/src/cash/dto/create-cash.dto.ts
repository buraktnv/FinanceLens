import { Currency } from '@prisma/client';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCashDto {
  @ApiProperty({
    example: 'Checking Account',
    description: 'Name of the cash account',
  })
  @IsString()
  accountName: string;

  @ApiProperty({ example: 5400.25, description: 'Current account balance' })
  @IsNumber()
  @Min(0)
  balance: number;

  @ApiPropertyOptional({
    enum: Currency,
    enumName: 'Currency',
    default: Currency.USD,
    description: 'Currency of the balance',
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({
    example: 'checking',
    description: 'Account type (e.g. checking, savings)',
  })
  @IsOptional()
  @IsString()
  accountType?: string;

  @ApiPropertyOptional({ example: 'Bank of America' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'Main emergency fund' })
  @IsOptional()
  @IsString()
  notes?: string;
}
