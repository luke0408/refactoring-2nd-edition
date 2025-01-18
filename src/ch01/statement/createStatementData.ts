import { InvoiceType, PlayType, StatementType } from '../types';

/**
 * statement에 필요한 데이터를 처리한다.
 *
 * @param invoice
 * @param plays
 * @returns
 */
export function createStatementData(invoice: InvoiceType.Invoice, plays: PlayType.Plays) {
  const result: StatementType.StatementData = {} as StatementType.StatementData;
  result.customer = invoice.customer;
  result.performances = invoice.performances.map(enrichPerformance);
  result.totalAmount = totalAmount(result);
  result.totalVolumeCredits = totalVolumeCredits(result);
  return result;

  /**
   * 공연 정보를 추가한다.
   *
   * @param performance
   * @returns
   */
  function enrichPerformance(performance: InvoiceType.PerformanceInfo): StatementType.PerformanceInfo {
    const result = Object.assign({}, performance) as StatementType.PerformanceInfo;
    result.play = playFor(result);
    result.amount = amountFor(result);
    result.volumeCredits = volumeCreditsFor(result);

    return result;
  }

  /**
   * performance를 통해 play 값을 구한다.
   *
   * @param performance
   * @returns
   */
  function playFor(performance: InvoiceType.PerformanceInfo): PlayType.PlayInfo {
    return plays[performance.playID];
  }

  /**
   * 청구 내역에 대한 금액을 구한다.
   *
   * @param performance
   * @returns
   */
  function amountFor(performance: StatementType.PerformanceInfo): number {
    let thisAmount: number = 0;
    switch (performance.play.type) {
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
        throw new Error(`알 수 없는 장르: ${performance.play.type}`);
    }
    return thisAmount;
  }

  /**
   * totalAmount를 구한다.
   *
   * @returns
   */
  function totalAmount(data: StatementType.StatementData) {
    return data.performances.reduce((total, p) => total + p.amount, 0);
  }

  /**
   * volumeCredites를 구한다.
   *
   * @returns
   */
  function totalVolumeCredits(data: StatementType.StatementData) {
    return data.performances.reduce((total, p) => total + p.volumeCredits, 0);
  }

  /**
   * 적립 포인트를 계산한다.
   *
   * @param performance
   * @returns
   */
  function volumeCreditsFor(performance: StatementType.PerformanceInfo): number {
    let volumeCredits = 0;
    volumeCredits += Math.max(performance.audience - 30, 0);

    if ('comedy' === performance.play.type) {
      volumeCredits += Math.floor(performance.audience / 5);
    }

    return volumeCredits;
  }
}
