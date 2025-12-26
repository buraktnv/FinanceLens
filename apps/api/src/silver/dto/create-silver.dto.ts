export class CreateSilverDto {
  name: string;
  quantity: number; // grams
  purchasePrice: number; // TRY per gram
  purchaseDate: string;
  purity?: string;
  location?: string;
  notes?: string;
}
