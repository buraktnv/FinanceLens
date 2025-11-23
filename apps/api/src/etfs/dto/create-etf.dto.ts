import { Currency } from '@prisma/client';

export class CreateEtfDto {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currency?: Currency;
  purchaseDate: string;
  expenseRatio?: number;
  broker?: string;
  notes?: string;
}
