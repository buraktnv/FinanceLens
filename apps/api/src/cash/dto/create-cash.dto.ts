import { Currency } from '@prisma/client';

export class CreateCashDto {
  accountName: string;
  balance: number;
  currency?: Currency;
  accountType?: string;
  bankName?: string;
  notes?: string;
}
