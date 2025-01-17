/**
 * Play Types
 */
export declare namespace PlayType {
  type PlayInfo = {
    name: string;
    type: string;
  };

  type Plays = Record<string, PlayInfo>;
}

/**
 * Invoice Types
 */
export declare namespace InvoiceType {
  type PerformanceInfo = {
    playID: string;
    audience: number;
  };

  type Invoice = {
    customer: string;
    performances: Array<PerformanceInfo>;
  };

  type Invoices = Array<Invoice>;
}
