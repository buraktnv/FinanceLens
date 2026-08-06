import { Currency } from '@prisma/client';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEtfDto {
  @ApiProperty({ example: 'SPY', description: 'Ticker symbol of the ETF' })
  @IsString()
  symbol: string;

  @ApiProperty({
    example: 'SPDR S&P 500 ETF Trust',
    description: 'Full name of the ETF',
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 25, description: 'Number of shares held' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    example: 420.75,
    description: 'Average purchase price per share',
  })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiPropertyOptional({
    enum: Currency,
    enumName: 'Currency',
    default: Currency.USD,
    description: 'Currency the ETF is denominated in',
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({
    example: '2024-02-01',
    description: 'Date the ETF was purchased',
  })
  @IsDateString()
  purchaseDate: string;

  @ApiPropertyOptional({
    example: 0.09,
    description: 'Annual expense ratio as a percentage',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expenseRatio?: number;

  @ApiPropertyOptional({ example: 'Vanguard' })
  @IsOptional()
  @IsString()
  broker?: string;

  @ApiPropertyOptional({ example: 'Core holding' })
  @IsOptional()
  @IsString()
  notes?: string;
}
