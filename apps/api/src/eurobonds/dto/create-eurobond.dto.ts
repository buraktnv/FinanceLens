import { Currency } from '@prisma/client';
import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEurobondDto {
  @ApiProperty({ example: 'TREASURY 5% 2030', description: 'Bond name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'US912810QY32',
    description: 'International Securities Identification Number',
  })
  @IsOptional()
  @IsString()
  isin?: string;

  @ApiProperty({ example: 1000, description: 'Face (par) value of the bond' })
  @IsNumber()
  @Min(0)
  faceValue: number;

  @ApiProperty({
    example: 980,
    description:
      'Absolute price paid per bond in the bond currency (not a percentage of face value)',
  })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: 10, description: 'Number of bonds purchased' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    example: 0.0525,
    description:
      'Annual coupon rate as a decimal fraction (0.0525 = 5.25% of face value)',
  })
  @IsNumber()
  @Min(0)
  @Max(1, {
    message: 'Kupon oranı ondalık kesir olmalı (örn. 0.0525)',
  })
  couponRate: number;

  @ApiPropertyOptional({
    enum: Currency,
    enumName: 'Currency',
    default: Currency.USD,
    description: 'Currency the bond is denominated in',
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Date the bond was purchased',
  })
  @IsDateString()
  purchaseDate: string;

  @ApiProperty({
    example: '2030-01-15',
    description: 'Maturity date of the bond',
  })
  @IsDateString()
  maturityDate: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Coupon payments per year',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  couponFrequency?: number;

  @ApiPropertyOptional({ example: 'Interactive Brokers' })
  @IsOptional()
  @IsString()
  broker?: string;

  @ApiPropertyOptional({ example: 'Held to maturity' })
  @IsOptional()
  @IsString()
  notes?: string;
}
