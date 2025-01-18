import { htmlStatement, statement } from '../../src/ch01/statement';
import { InvoiceType, PlayType } from '../../src/ch01/types';

describe('StatementTest', () => {
  let invoiceData: InvoiceType.Invoices;
  let playsData: PlayType.Plays;

  beforeAll(async () => {
    invoiceData = JSON.parse(require('fs').readFileSync('src/ch01/data/invoice.json', 'utf-8'));
    playsData = JSON.parse(require('fs').readFileSync('src/ch01/data/plays.json', 'utf-8'));
  });

  it('statement는 string 결과 값을 도출할 수 있다.', async () => {
    const result = statement(invoiceData[0], playsData);
    expect(result).toBe(
      '청구 내역 (고객명: BigCo)\n' +
        ' Hamlet: $650.00 (55석)\n' +
        ' As You Like It: $580.00 (35석)\n' +
        ' Othello: $500.00 (40석)\n' +
        '총액: $1,730.00\n' +
        '적립 포인트: 47점\n',
    );
  });

  it('statement는 html 결과 값을 도출할 수 있다.', async () => {
    const result = htmlStatement(invoiceData[0], playsData);
    expect(result).toBe(
      '<h1>청구 내역 (고객명: BigCo)</h1>\n' +
        '<table>\n' +
        '<tr><th>연극</th><th>좌석 수</th><th>금액</th></tr>' +
        '<tr><td>Hamlet</td><td>(55석)</td><td>$650.00</td></tr>\n' +
        '<tr><td>As You Like It</td><td>(35석)</td><td>$580.00</td></tr>\n' +
        '<tr><td>Othello</td><td>(40석)</td><td>$500.00</td></tr>\n' +
        '</table>\n' +
        '<p>총액: <em>$1,730.00</em></p>\n' +
        '<p>적립 포인트: <em>47</em>점</p>\n',
    );
  });
});
