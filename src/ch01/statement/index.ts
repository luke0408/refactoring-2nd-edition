import { InvoiceType, PlayType, StatementType } from '../types';

/**
 * 연극에 대한 청구 내역과 총액, 적립 포인트를 반환한다.
 *
 * @param invoice
 * @param plays
 * @returns
 */
export function statement(invoice: InvoiceType.Invoice, plays: PlayType.Plays): string {
  const statementData: StatementType.StatementData = {} as StatementType.StatementData;
  statementData.customer = invoice.customer;
  statementData.performances = invoice.performances.map(enrichPerformance);

  return renderPlainText(statementData, plays);

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
}

/**
 * 청구 내역을 출력한다.
 *
 * @param data
 * @param plays
 * @returns
 */
function renderPlainText(data: StatementType.StatementData, plays: PlayType.Plays) {
  let result: string = `청구 내역 (고객명: ${data.customer})\n`;

  for (let perf of data.performances) {
    result += ` ${perf.play.name}: ${usd(perf.amount)} (${perf.audience}석)\n`;
  }

  result += `총액: ${usd(totalAmount())}\n`;
  result += `적립 포인트: ${totalVolumeCredits()}점\n`;

  return result;

  /**
   * totalAmount를 구한다.
   *
   * @returns
   */
  function totalAmount() {
    let result: number = 0;
    for (let perf of data.performances) {
      result += perf.amount;
    }
    return result;
  }

  /**
   * volumeCredites를 구한다.
   *
   * @returns
   */
  function totalVolumeCredits() {
    let result: number = 0;
    for (let perf of data.performances) {
      result += volumeCreditsFor(perf);
    }
    return result;
  }

  /**
   * USD 화패 단위에 맞게 값을 수정한다.
   *
   * @param number
   * @returns
   */
  function usd(number: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(number / 100);
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
