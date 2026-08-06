import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoldDto {
  @ApiProperty({
    example: 'Gold Bar 100g',
    description: 'Name or label of the holding',
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 100, description: 'Weight in grams' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    example: 1850.0,
    description: 'Purchase price per gram (TRY)',
  })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: '2024-01-20', description: 'Date of purchase' })
  @IsDateString()
  purchaseDate: string;

  @ApiPropertyOptional({
    example: '24K',
    description: 'Purity of the gold (e.g. 22K, 24K)',
  })
  @IsOptional()
  @IsString()
  purity?: string;

  @ApiPropertyOptional({ example: 'Home safe' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Gift' })
  @IsOptional()
  @IsString()
  notes?: string;
}
