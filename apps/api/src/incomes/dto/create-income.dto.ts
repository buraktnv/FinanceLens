import { Currency, IncomeType, Frequency } from '@prisma/client';

export class CreateIncomeDto {
  amount: number;
  currency?: Currency;
  type: IncomeType;
  description?: string;
  date: string;
  isRecurring?: boolean;
  frequency?: Frequency;
  propertyId?: string;
  notes?: string;
}
