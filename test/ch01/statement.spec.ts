import { statement } from '../../src/ch01/statement';
import { InvoiceType, PlayType } from '../../src/ch01/types';

describe('StatementTest', () => {
    let invoiceData: InvoiceType.Invoices;
    let playsData: PlayType.Plays;

    beforeAll(async () => {
        invoiceData = JSON.parse(require('fs').readFileSync('src/ch01/data/invoice.json', 'utf-8'));
        playsData = JSON.parse(require('fs').readFileSync('src/ch01/data/plays.json', 'utf-8'))
    });
    
    it('statement는 string 결과 값을 도출할 수 있다.', async () => {
        const result = statement(invoiceData[0], playsData);
        expect(result).toBe(
            '청구 내역 (고객명: BigCo)\n' +
            'Hamlet: $650.00 55석\n' +
            'As You Like It: $580 35석\n' +
            'Othello: $500 40석\n' +
            '총액: $1730\n' +
            '적립 포인트: 47점'
        )
    });
});