# Ch01. 리팩터링: 첫번째 예시
<!--TODO: 모든 소스 코드 링크 걸기 -->
> 해당 장의 모든 코드는 아래의 위치에 존재합니다.
> - [소스 코드](../../src/ch01/)
> - [테스트 코드](../../test/ch01/)

해당 책에서는 리팩터링을 설명할 때 원칙을 나열해서 설명하기 보다 간단한 예제를 통해 설명을 하고자한다. 사실 예제 코드들이 너무 간단하여 모든 리팩토링 원칙을 적용할 필요는 없느나 그 코드가 대규모 시스템의 일부라면 리팩토링을 하고 안하고의 차이가 크다. 

때문에 각 예제 코드는 `대규모 시스템에서 발췌한 코드`라고 가정하고 진행된다.

## 1.1 자 시작해보자.

다양한 연극을 외주로 받아서 공연하는 극단이 있다고 가정해보자. 공연 요청이 들어오면 연극의 장르와 관객 규모를 기초로 비용을 책정한다.

현재 이 극단은 두 가지 장르, 비극(tragedy)과 희극(comedy)만 공연한다. 그리고 공연료와 별개로 포인트(volume credit)를 지급해서 다음번 의뢰 시 공연료를 할인받을 수 있다.

극단은 공연할 연극 정보를 다음과 같이 간단한 JSON 파일에 저장한다. 

> [plays.json](../../src/ch01/data/plays.json)

```json
{
  "hamlet": {
    "name": "Hamlet",
    "type": "tragedy"
  },
  "as-like": {
    "name": "As You Like It",
    "type": "comedy"
  },
  "othello": {
    "name": "Othello",
    "type": "tragedy"
  }
}
```

공연료 청구서에 들어갈 데이터도 다음과 같이 JSON 파일로 표현한다. 

> [invoice.json](../../src/ch01/data/invoice.json)

```json
[
  {
    "customer": "BigCo",
    "performances": [
      {
        "playID": "hamlet",
        "audience": 55
      },
      {
        "playID": "as-like",
        "audience": 35
      },
      {
        "playID": "othello",
        "audience": 40
      }
    ]
  }
]
```

공연료 청구서를 출력하는 코드는 다음과 같이 [statement](../../src/ch01/statement/index.ts) 함수로 구현된다.

```ts
import { InvoiceType, PlayType } from '../types';

export const statement = (invoice: InvoiceType.Invoice, plays: PlayType.Plays) => {
  let totalAmount: number = 0;
  let volumeCredits: number = 0;
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;

  const format = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format;

  for (let perf of invoice.performances) {
    const play = plays[perf.playID];
    let thisAmount = 0;

    switch (play?.type) {
      case 'tragedy':
        thisAmount = 40000;
        if (perf.audience > 30) {
          thisAmount += 1000 * (perf.audience - 30);
        }
        break;
      case 'comedy':
        thisAmount = 30000;
        if (perf.audience > 20) {
          thisAmount += 10000 + 500 * (perf.audience - 20);
        }
        thisAmount += 300 * perf.audience;
        break;
      default:
        throw new Error(`알 수 없는 장르: ${play?.type}`);
    }

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
};
```

결과는 다음과 같이 출력 된다.

```text
청구내역 (고객명: BigCo)
 Hamlet: $650.00 (55석)
 As You Like It: $580.00 (35석)
 Othello: $500.00 (40석)
총액: $1,730.00
적립 포인트: 47점
```

## 1.2 예시 프로그램을 본 소감

당자 지금의 코드만 본다면 특별히 애써 이해해야할 구조도 없고 기능도 잘 작동하기 때문에 큰 문제가 없다고 여겨진다. 단순히 "지저분하다" 라는 이유로 불평하는 것은 프로그램을 너무 미적으로 판단하는 것은 아닐까?

컴파일러는 지저분한 코드이던지, 미적인 코드이던지 전혀신경쓰지 않는다. 하지만, 그 코드를 수정하려면 사람이 개입되고, 사람은 코드의 미적 상태에 계민하다.

사람은 설계가 나쁜 시스템을 수정하기 어렵다.

원하는 동작을 수행하도록 하기 위해 수정해야 할 부분을 찾고, 기존 코드와 잘 맞물려 작동하게 할 방법을 강구하기 어렵기 때문이다. 때문에 수백 줄짜리 코드를 수정할 때 먼저 프로그램의 작동 박식을 더 쉽게 파악할 수 있도록 코드를 여러 함수의 요소로 재구성하는 것을 추천한다.

프로그램의 구조가 빈약하다면 대체로 구조부터 바로 잡은 뒤에 기능을 수정하는 편이 작업하기 훨씬 수월하다.

코드에서 사용자의 입맞에 맞게 수정할 부분을 몇가지 발견했다.

[요구사항 추가]
- 청구 내역을 HTML의 형태로 출력하는 기능 구현
- 더욱 다양한 장르가 추가되며 이에 따른 공연료 및 적립 포인트 계산법 수정 필요

[주의점]
- 기존의 statement() 함수를 복제하는 것은 DRY 원칙 위반
- 기존의 statement() 함수에 if문 분기를 추가해 기능을 구현하는 것은 복잡도가 증가되는 문제 발생

리펙토링이 필요한 이유는 이와같은 변경점이 발생하기 때문이다. 잘 작동하고 나중에 변경할 일이 없다면 코드를 현재 상태로 나둬도 문제가 없지만, 사용자가 있는 대부분의 코드는 항상 변화한다.

## 1.3 리팩토링의 첫 단계

리팩토링의 첫 단계는 코드가 잘 작동하는지 확인해줄 테스트 코드를 만드는 것이다.

[statement() 함수에 대한 테스트 코드](../../test/ch01/statement.spec.ts)는 다음과 같이 작성했다.

```ts
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
```

위 테스트 코드는 jest 라이브러리를 사용해 작성했으며 `npm run test`를 통해 실행 가능하다.