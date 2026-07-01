export interface MLCategory {
  id: string;
  name: string;
  picture?: string;
}

export interface MLTrend {
  keyword: string;
  url: string;
}

export interface MLHighlightId {
  id: string;
}

export interface MLHighlightItem {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  currency_id: string;
  permalink: string;
}
