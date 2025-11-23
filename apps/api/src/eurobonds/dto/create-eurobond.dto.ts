import { Currency } from '@prisma/client';

export class CreateEurobondDto {
  name: string;
  isin?: string;
  faceValue: number;
  purchasePrice: number;
  quantity: number;
  couponRate: number;
  currency?: Currency;
  purchaseDate: string;
  maturityDate: string;
  couponFrequency?: number;
  broker?: string;
  notes?: string;
}
