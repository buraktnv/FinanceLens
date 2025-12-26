import { CreateGoldDto } from './create-gold.dto';

export class UpdateGoldDto implements Partial<CreateGoldDto> {
  name?: string;
  quantity?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  purity?: string;
  location?: string;
  notes?: string;
}
