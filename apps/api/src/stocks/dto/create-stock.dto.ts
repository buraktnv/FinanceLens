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

export class CreateStockDto {
  @ApiProperty({ example: 'AAPL', description: 'Ticker symbol of the stock' })
  @IsString()
  symbol: string;

  @ApiProperty({
    example: 'Apple Inc.',
    description: 'Full name of the company',
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 10, description: 'Number of shares held' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    example: 145.5,
    description: 'Average purchase price per share',
  })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiPropertyOptional({
    enum: Currency,
    enumName: 'Currency',
    default: Currency.USD,
    description: 'Currency the stock is denominated in',
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Date the stock was purchased',
  })
  @IsDateString()
  purchaseDate: string;

  @ApiPropertyOptional({ example: 'Interactive Brokers' })
  @IsOptional()
  @IsString()
  broker?: string;

  @ApiPropertyOptional({ example: 'Long-term hold' })
  @IsOptional()
  @IsString()
  notes?: string;
}
