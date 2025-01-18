import { InvoiceType, PlayType, StatementType } from '../types';
import { createStatementData } from './createStatementData';

/**
 * 연극에 대한 청구 내역과 총액, 적립 포인트를 반환한다.
 *
 * @param invoice
 * @param plays
 * @returns
 */
export function statement(invoice: InvoiceType.Invoice, plays: PlayType.Plays): string {
  return renderPlainText(createStatementData(invoice, plays));
}

/**
 * 청구 내역을 출력한다.
 *
 * @param data
 * @param plays
 * @returns
 */
function renderPlainText(data: StatementType.StatementData) {
  let result: string = `청구 내역 (고객명: ${data.customer})\n`;

  for (let perf of data.performances) {
    result += ` ${perf.play.name}: ${usd(perf.amount)} (${perf.audience}석)\n`;
  }

  result += `총액: ${usd(data.totalAmount)}\n`;
  result += `적립 포인트: ${data.totalVolumeCredits}점\n`;

  return result;

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
}
