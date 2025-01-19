interface Customer {
  id: string;
  name: string;
}

/**
 * Play Type
 */
export type Play = {
  name: string;
  type: string;
};

export type Plays = Record<string, Play>;

/**
 * Performance Type
 */
export interface Performance {
  playID: string;
  audience: number;
}

export interface EnrichPerformance extends Performance {
  play: Play;
  amount: number;
  volumeCredits: number;
}

/**
 * Invoice Type
 */
export type Invoice = {
  customer: Customer['name'];
  performances: Array<Performance>;
};

export type Invoices = Array<Invoice>;

/**
 * Statement Type
 */
export type Statement = {
  customer: Customer['name'];
  performances: Array<EnrichPerformance>;
  totalAmount: number;
  totalVolumeCredits: number;
};
