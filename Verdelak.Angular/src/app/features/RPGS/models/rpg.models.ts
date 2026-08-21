export interface IdName { id: number; name: string; }

export interface ProductListItem {
  id: number;
  productName: string;
  isbn?: string;
  edition?: string;
  status?: string;
  system?: string;
  series?: string;
  type?: string;
}

export interface ProductListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: ProductListItem[];
}

export interface ProductDetail {
  id: number;
  productName: string;
  description?: string;
  productNum?: string;
  isbn?: string;
  edition?: string;
  status?: string;
  systemID?: number;
  system?: string;
  seriesID?: number;
  series?: string;
  productTypeID?: number;
  type?: string;
  systemNotes: string[];
  seriesNotes: string[];
}

export type RpgStatusFilter = 'H' | 'W' | 'all' | 'unknown';
