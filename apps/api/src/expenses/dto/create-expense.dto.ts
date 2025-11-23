import { Currency, ExpenseCategory, Frequency, PaymentMethod } from '@prisma/client';

export class CreateExpenseDto {
  amount: number;
  currency?: Currency;
  category: ExpenseCategory;
  description?: string;
  date: string;
  isRecurring?: boolean;
  frequency?: Frequency;
  paymentMethod?: PaymentMethod;
  propertyId?: string;
  notes?: string;
}
