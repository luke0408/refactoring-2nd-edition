/**
 * Play Types
 */
export declare namespace PlayType {
  type PlayInfo = {
    name: string;
    type: string;
  };

  type Plays = Map<string, PlayInfo>;
}

/**
 * Invoice Types
 */
export declare namespace InvoiceType {
  type PerformanceInfo = {
    playID: string;
    audience: number;
  };

  export type Invoice = {
    customer: string;
    performances: PerformanceInfo[];
  };
}
