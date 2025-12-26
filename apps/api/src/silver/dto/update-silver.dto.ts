import { CreateSilverDto } from './create-silver.dto';

export class UpdateSilverDto implements Partial<CreateSilverDto> {
  name?: string;
  quantity?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  purity?: string;
  location?: string;
  notes?: string;
}
