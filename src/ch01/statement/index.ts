import { InvoiceType, PlayType } from '../types';

/**
 * 연극에 대한 청구 내역과 총액, 적립 포인트를 반환한다.
 * 
 * @param invoice 
 * @param plays 
 * @returns 
 */
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  let totalAmount: number = 0;
  let volumeCredits: number = 0;
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;

  const format = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format;

  for (let perf of invoice.performances) {
    const play = playFor(perf);
    let thisAmount = 0;

    thisAmount = amountFor(play, perf);

    // 포인트를 제공한다.
    volumeCredits += Math.max(perf.audience - 30, 0);

    // 희극 관객 5명마다 추가 포인트를 제공한다.
    if ('comedy' === play?.type) volumeCredits += Math.floor(perf.audience / 5);

    // 청구 내역을 출력한다.
    result += ` ${play?.name}: ${format(thisAmount / 100)} (${perf.audience}석)\n`;
    totalAmount += thisAmount;
  }
  
  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
  
  /**
   * performance를 통해 play 값을 구한다.
   * 
   * @param performance 
   * @returns 
   */
  function playFor(
    performance: InvoiceType.PerformanceInfo
  ): PlayType.PlayInfo {
    return plays[performance.playID];
  };

  /**
   * 청구 내역에 대한 금액을 구한다.
   * 
   * @param play 
   * @param performance 
   * @returns 
   */
  function amountFor (
    play: PlayType.PlayInfo,
    performance: InvoiceType.PerformanceInfo
  ): number {
    let thisAmount: number = 0;
    switch (play?.type) {
      case 'tragedy':
        thisAmount = 40000;
        if (performance.audience > 30) {
          thisAmount += 1000 * (performance.audience - 30);
        }
        break;
      case 'comedy':
        thisAmount = 30000;
        if (performance.audience > 20) {
          thisAmount += 10000 + 500 * (performance.audience - 20);
        }
        thisAmount += 300 * performance.audience;
        break;
      default:
        throw new Error(`알 수 없는 장르: ${play?.type}`);
    }
    return thisAmount;
  };
};
