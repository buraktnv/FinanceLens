import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSilverDto {
  @ApiProperty({
    example: 'Silver Coin 1oz',
    description: 'Name or label of the holding',
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 31.1, description: 'Weight in grams' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    example: 28.5,
    description: 'Purchase price per gram (TRY)',
  })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: '2024-01-20', description: 'Date of purchase' })
  @IsDateString()
  purchaseDate: string;

  @ApiPropertyOptional({
    example: '999',
    description: 'Purity of the silver (e.g. 925, 999)',
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
