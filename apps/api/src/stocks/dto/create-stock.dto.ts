import { Currency } from '@prisma/client';

export class CreateStockDto {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currency?: Currency;
  purchaseDate: string;
  broker?: string;
  notes?: string;
}
