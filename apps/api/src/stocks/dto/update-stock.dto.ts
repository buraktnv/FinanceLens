import { CreateStockDto } from './create-stock.dto';

export class UpdateStockDto implements Partial<CreateStockDto> {
  symbol?: string;
  name?: string;
  quantity?: number;
  purchasePrice?: number;
  currency?: any;
  purchaseDate?: string;
  broker?: string;
  notes?: string;
}
