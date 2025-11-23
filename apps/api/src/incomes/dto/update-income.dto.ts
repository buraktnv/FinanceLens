import { CreateIncomeDto } from './create-income.dto';

export class UpdateIncomeDto implements Partial<CreateIncomeDto> {
  amount?: number;
  currency?: any;
  type?: any;
  description?: string;
  date?: string;
  isRecurring?: boolean;
  frequency?: any;
  propertyId?: string;
  notes?: string;
}
