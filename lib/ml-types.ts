export interface MLCategory {
  id: string;
  name: string;
  picture?: string;
}

export interface MLTrend {
  keyword: string;
  url: string;
}

export interface MLHighlightEntry {
  id: string;
  position: number;
  type: "PRODUCT" | "ITEM";
}

export interface MLHighlightItem {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  currency_id: string;
  permalink: string;
}
