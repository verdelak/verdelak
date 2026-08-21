export interface HomeInventoryItem {
  id: number;
  item: string;
  description?: string;
  makeModel?: string;
  serialNumber?: string;
  purchaseDate?: string| null;
  purchaseLocation?: string;
  purchasePrice?: number;
  estimatedValue?: number;
  roomId: number;
}