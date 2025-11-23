import { CreateEurobondDto } from './create-eurobond.dto';

export class UpdateEurobondDto implements Partial<CreateEurobondDto> {
  name?: string;
  isin?: string;
  faceValue?: number;
  purchasePrice?: number;
  quantity?: number;
  couponRate?: number;
  currency?: any;
  purchaseDate?: string;
  maturityDate?: string;
  couponFrequency?: number;
  broker?: string;
  notes?: string;
}
