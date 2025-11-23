import { CreateEtfDto } from './create-etf.dto';

export class UpdateEtfDto implements Partial<CreateEtfDto> {
  symbol?: string;
  name?: string;
  quantity?: number;
  purchasePrice?: number;
  currency?: any;
  purchaseDate?: string;
  expenseRatio?: number;
  broker?: string;
  notes?: string;
}
