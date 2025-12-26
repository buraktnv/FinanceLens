import { CreateCashDto } from './create-cash.dto';

export class UpdateCashDto implements Partial<CreateCashDto> {
  accountName?: string;
  balance?: number;
  currency?: any;
  accountType?: string;
  bankName?: string;
  notes?: string;
}
