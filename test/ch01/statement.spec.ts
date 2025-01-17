import { statement } from '../../src/ch01/statement';
import { InvoiceType, PlayType } from '../../src/ch01/types';

describe('StatementTest', () => {
  let invoiceData: InvoiceType.Invoices;
  let playsData: PlayType.Plays;

  beforeAll(async () => {
    const invoiceJson: string = require('fs').readFileSync('src/ch01/data/invoice.json', 'utf-8');
    const playsJson: string = require('fs').readFileSync('src/ch01/data/plays.json', 'utf-8');

    invoiceData = JSON.parse(invoiceJson);
    playsData = JSON.parse(playsJson);

    console.log(playsJson + '\n' + typeof playsJson);
    console.dir(playsData, { depth: null });
  });

  it('statement는 string 결과 값을 도출할 수 있다.', async () => {
    const result = statement(invoiceData[0], playsData);
    expect(result).toBe(
      '청구 내역 (고객명: BigCo)\n' +
      ' Hamlet: $650.00 (55석)\n' +
      ' As You Like It: $580.00 (35석)\n' +
      ' Othello: $500.00 (40석)\n' +
      '총액: $1,730.00\n' +
      '적립 포인트: 47점\n'
    );
  });
});
