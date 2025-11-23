import { CreateExpenseDto } from './create-expense.dto';

export class UpdateExpenseDto implements Partial<CreateExpenseDto> {
  amount?: number;
  currency?: any;
  category?: any;
  description?: string;
  date?: string;
  isRecurring?: boolean;
  frequency?: any;
  paymentMethod?: any;
  propertyId?: string;
  notes?: string;
}
