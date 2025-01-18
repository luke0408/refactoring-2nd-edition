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

공연료 청구서를 출력하는 코드는 다음과 같이 `statement()` 함수로 구현된다.

> statement()

```ts
import { InvoiceType, PlayType } from '../types';

export function statement(
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

statement() 함수에 대한 테스트 코드는 다음과 같이 작성했다.

> statement.spec.ts

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

위 테스트 코드는 [jest](https://jestjs.io/) 라이브러리를 사용해 작성했으며 `npm run test`를 통해 실행 가능하다.

## 1.4 statement() 함수 쪼개기

statement() 함수 중간에는 switch 문이 있다. 이 switch 문을 살펴보면 한 번의 공연에 대한 요금을 계산하고 있다.

> statement() 함수의 switch 문

```ts
// 문제의 스위치문 
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
```

이러한 사실은 코드 분석을 하면서 얻은 정보다.

워드 커닝햄(Ward Cunningham) 이 말하길, 이런 식으로 파악한 정보는 휘발성이 높기로 악명 높은 저장 장치인 내 머릿속에 기록되므로, 잊지 않으려면 재빨리 코드에 반영해야 한다.

그러면 다음번에 코드를 볼 때, 다시 분석하지 않아도 코드 스스로가 자신이 하는 일이 무엇인지 이야기해줄 것이다.

여기서는 코드 조각을 별도 함수로 추출하는 방식으로 앞서 파악한 정보를 코드에 반영할 것이다.

추출한 함수에는 그 코드가 하는 일을 설명하는 이름을 지워준다. 이름은 amountFor(performance) 정도면 적당해 보인다.

먼저 별도 함수로 빼냈을 때 유효범위를 벗어나는 변수, 즉 새 함수에서 필요한 변수들을 뽑는다.

여기서는 performance, play, thisAmount 가 있다.

뽑은 변수에서 performance 와 play 같은 경우는 값을 참조만 하지 변경하지 않으니까 새 함수의 파라미터로 전달하면 된다.

그치만 thisAmount 같은 경우는 새 함수에서 변경을 하는데 이는 주의해서 다뤄야한다.

여기서는 새 함수에서 변경하는 함수가 thisAmount 밖에 없으니까 이것을 새 함수에서 선언하고 리턴해주는 방식으로 사용하면 된다.

이렇게 리팩토링한 결과는 다음과 같다.

> statement()

```ts
export function statement(
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
    const play = plays[perf.playID];
    let thisAmount = 0;

    thisAmount = amountFor(perf, play);

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

> amountFor()

```ts
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
```

이제 test를 돌려 잘 작동하는 것을 확인하자. <br>
*(이후에는 test 코드가 변경되는 지점에서만 test 결과를 첨부하겠다.)*

> npm run test 결과

```bash
$ ~/refactoring-2nd-edition{master}$ npm run test

> refactoring@0.0.0 test
> jest

 PASS  test/ch01/statement.spec.ts (6.629 s)
  StatementTest
    ✓ statement는 string 결과 값을 도출할 수 있다. (24 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        6.736 s, estimated 7 s
Ran all test suites.
```

다행이도 테스트는 한번에 통과했다. 그리고 함수를 추출했으니 추출된 함수 코드를 자세히 들여다보면서 지금보다 명확하게 표현할 수 있는 간단한 방법은 없는지 검토한다.

가장 먼저 변수의 이름을 더 명확하게 바꿔보자. thisAmount 의 이름은 result 로 변경하는게 가능하다.

### Play 변수 제거하기

amountFor()의 매개변수를 살펴보면서 이 값들이 어디서 오는지 알아보자. preformance는 반복문을 돌때마다 변경되어 들어오는 반면 play는 개별 공연(preformence)에서 오기 때문에 사실 매개변수로 전달할 필요가 없다.

단순하게 이 값을 계산해주는 함수를 만들어 amountFor() 내부에서 호출하기만 하면 된다. 

마틴 파울러는 긴 함수를 잘게 쪼갤 때마다 play 같은 변수를 최대한 제거한다. 이런 임시 변수들 때문에 로컬 범위에 존재하는 이름이 늘어나서 추출 작업이 복잡해 지는 것을 방지할 수 있다.

이를 해결해주는 리팩터링으로는 `임시 변수를 질의 함수로 바꾸기` 기법을 사용할 수 있다.

이제 다음과 같이 변경된 코드를 볼 수 있다.

> playFor()

```ts
function playFor(
  performance: InvoiceType.PerformanceInfo
): PlayType.PlayInfo {
  return plays[performance.playID];
};
```

> statement()

```ts
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
    const play = playFor(perf); // <-- 우변을 함수로 변경
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
};
```

이렇게 지역 변수를 제거하면 유효 범위를 신경써야할 대상이 줄어들기 때문에 함수 추출하기 작업이 훨씬 쉬워진다.

이제 다시 statement() 함수를 보면, playFor() 함수를 통해 play를 구하게 되었으니 `변수 인라인 하기`를 통해 매개변수를 제거 할 수 있게 되었다.

이번에 제거하게 될 매개변수는 `play`와 `thisAmount` 이다.

> amountFor()

```ts
function amountFor (
  performance: InvoiceType.PerformanceInfo
): number {
  let thisAmount: number = 0;
  switch (playFor(performance).type) {
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
      throw new Error(`알 수 없는 장르: ${playFor(performance).type}`);
  }
  return thisAmount;
};
```

> statement()

```ts
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
    // 포인트를 제공한다.
    volumeCredits += Math.max(perf.audience - 30, 0);

    // 희극 관객 5명마다 추가 포인트를 제공한다.
    if ('comedy' === playFor(perf).type) volumeCredits += Math.floor(perf.audience / 5);

    // 청구 내역을 출력한다.
    result += ` ${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }
  
  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
}
```

### 적립 포인트 계산 코드 추출하기

아직 처리해야할 변수가 두 개 더 남았다. 여기서도 perf는 값의 전달만 하면 되기 때문에 인라인으로 처리해도 된다. 하지만 volumeCredits는 반복분을 돌 때마다 값을 누적해야하기 때문에 이부분을 신경써줘야 한다.

이 상황에서 최선의 방법은 추출한 함수에서 volumeCredits의 복제본을 초기화 한 뒤에 계산 결과를 반환하게 하는 것이다. 그 역할을 하는 함수에 volumeCreditsFor()이라는 이름을 붙여주었다.

> volumeCreditsFor()

```ts
function volumeCreditsFor(
  performance: InvoiceType.PerformanceInfo
): number {
  let volumeCredits = 0;
  volumeCredits += Math.max(performance.audience - 30, 0);
  
  if ('comedy' === playFor(performance).type) {
    volumeCredits += Math.floor(performance.audience / 5);
  }
  return volumeCredits;
}
```

> statement()
```ts
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
    volumeCredits += volumeCreditsFor(perf);

    // 청구 내역을 출력한다.
    result += ` ${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }
  
  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
}
```

### format 변수 제거하기

앞에서 설명했듯이 임시 변수는 나중에 문제를 일으킬 수 있다. 임시 변수는 자신이 속한 루틴에서만 의미가 있어서 루틴이 길고 복잡하다. 따라서 이번 리팩토링에서는 이런 변수를 제거하고자 한다.

format은 임시 변수에 함수를 대입한 형태인데, 이를 직접 함수로 선언해 사용하는 형태로 바꾸어 보았다.

> format()

```ts
function format(number: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(number);
}
```

> statement()

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  let totalAmount: number = 0;
  let volumeCredits: number = 0;
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;

  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);

    // 청구 내역을 출력한다.
    result += ` ${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }
  
  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
}
```

하지만 format 이라는 함수명은 화패 단위 맞추기라는 기능을 재대로 설명하지 못하는 것 같아 다음과 같이 usd 라는 이름으로 변경해주었다.

또한 공통적으로 들어가는 나누기 100 로직도 함수 내부로 이동 시킴으로써 세부적인 기능을 함수 내부로 숨겼다.

> usd()

```ts
function usd(number: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(number / 100);
}
```

> statement()

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  let totalAmount: number = 0;
  let volumeCredits: number = 0;
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;

  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);

    // 청구 내역을 출력한다.
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }
  
  result += `총액: ${usd(totalAmount)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
}
```

### volumeCredits 변수 제거하기

해당 변수는 반복문을 한 바뀌 돌 때마다 값을 누적하기 땜누에 리팩토링이 까다롭다. 때문에 먼저 반복분 쪼개기를 통해 volumeCredis 값이 누적되는 부분을 따로 빼줘야한다.

> statement()

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  let totalAmount: number = 0;
  let volumeCredits: number = 0;
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;

  for (let perf of invoice.performances) {
    // 청구 내역을 출력한다.
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }

  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
  }
  
  result += `총액: ${usd(totalAmount)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
}
```

이어서 문장 슬라이스하기를 적용해서 volumeCredits 변수를 선언하는 문장을 반복문 앞으로 옮긴다.

> statement()

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  let totalAmount: number = 0;
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;

  for (let perf of invoice.performances) {
    // 청구 내역을 출력한다.
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }

  let volumeCredits: number = 0;
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
  }
  
  result += `총액: ${usd(totalAmount)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
}
```

이제 임시 변수를 질의 함수로 바꾸기가 수월해졌으니 volumeCredits 변수를 제거할 수 있다. 우선 함수를 추출 하자.

> totalVolumeCredits()

```ts
function totalVolumeCredits() {
  let volumeCredits: number = 0;
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
  }
  return volumeCredits;
}
```

이후 volumeCredits 변수를 인라인 하면 다음과 같은 코드를 얻을 수 있다.

> statement()

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  let totalAmount: number = 0;
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;
  
  for (let perf of invoice.performances) {
    // 청구 내역을 출력한다.
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }
  
  result += `총액: ${usd(totalAmount)}\n`;
  result += `적립 포인트: ${totalVolumeCredits();}점\n`;
  
  return result;
}
```

여기서 잠시 멈추고 방금 한 일에 대해서 생각해보자. 무엇보다도 반복문을 쪼개서 성능이 느려지진 않을까 걱정할 수 있다.

하지만 실제로 변경 전후의 코드를 테스트 해본 결과는 다음과 같다.

```bash
// for문 쪼개기 적용 전
PASS  test/ch01/statement.spec.ts (5.967 s)
 StatementTest
   ✓ statement는 string 결과 값을 도출할 수 있다. (22 ms)

// for문 쪼개기 적용 후
PASS  test/ch01/statement.spec.ts (6.364 s)
 StatementTest
   ✓ statement는 string 결과 값을 도출할 수 있다. (26 ms)
```

실제 이번 리팩터링 전과 후의 실행 시간은 거의 차이가 나지 않는다. 똑똑한 컴파일러들은 최신 캐싱 기법 등으로 무장하고 있어 우리의 직관을 초월하는 결과를 보여주기 때문에, 이런 성능에 대한 우리의 예측은 자주 실패하기 마련이다.

하지만 '대체로 그렇다'와 '항상 그렇다'는 엄연히 다르다. 때로는 리팩터링이 성능에 큰 영향을 주기도 한다. 그런 경우라도 마틴 파울러는 개의치 않고 우선 리팩터링을 진행한다고 한다. 이는 "잘 다듬어진 코드가 성능 개선 작업도 훨씬 수월하기 때문"이라는 그의 경험에서 나온 결과이다.

만약 리팩터링 때문에 성능이 떨어진다면, 일단 무시하고 진행한 뒤 이후에 성능을 다시 개선하자.

또한, volumeCredits 변수를 제거하는 과정을 아래와 같이 아주 잘게 나누웠다는 점에 집중해야한다.

1. **반복문 쪼개기**로 변수 값을 누적시키는 부분을 분리한다.
2. **문장 슬라이드 하기**로 변수 초기화 문장을 변수 값 누적 코드 바로 앞으로 옮긴다.
3. **함수 추출하기**로 적립 포인트 계산 부분을 별도 함수로 추출한다.
4. **변수 인라인하기**로 volumeCredits 변수를 제거한다.

모든 순간 위 처럼 잘게 단계를 나누어 진행할 수 있는 건 아니겠지만, 그래도 상황이 복잡해지면 단계를 더 잘게 나누는 것을 추천한다. 특히, 리팩터링 중간에 테스트가 실패하고 원인을 바로 찾지 못한다면 이전 커밋으로 돌아가 단계를 나누어 진행하면 문제를 해결할 가능성이 높다.

자 이제 마지막으로 totalAmount도 앞에서 진행한 것과 같은 절차로 제거하겠다. 이땐 중간 과정은 생략하고 결과 코드만 보여주도록 하겠다.

> totalAmount()

```ts
function totalAmount() {
  let result: number = 0;
  for (let perf of invoice.performances) {
    result += amountFor(perf);
  }
  return result;
}
```

> statement()

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;
  
  for (let perf of invoice.performances) {
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
  }
    
  result += `총액: ${usd(totalAmount())}\n`;
  result += `적립 포인트: ${totalVolumeCredits()}점\n`;
  
  return result;
}
```

## 1.5 중간 점검: 난무하는 중첩 함수

지금까지의 코드를 한번 전체적으로 봐보자.

> statement()

```ts
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
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;
  
  for (let perf of invoice.performances) {
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
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
    for (let perf of invoice.performances) {
      result += amountFor(perf);
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
    for (let perf of invoice.performances) {
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
   * @param performance 
   * @returns 
   */
  function amountFor (
    performance: InvoiceType.PerformanceInfo
  ): number {
    let thisAmount: number = 0;
    switch (playFor(performance).type) {
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
        throw new Error(`알 수 없는 장르: ${playFor(performance).type}`);
    }
    return thisAmount;
  };

  /**
   * 적립 포인트를 계산한다.
   * 
   * @param performance 
   * @returns 
   */
  function volumeCreditsFor(
    performance: InvoiceType.PerformanceInfo
  ): number {
    let volumeCredits = 0;
    volumeCredits += Math.max(performance.audience - 30, 0);
    
    if ('comedy' === playFor(performance).type) {
      volumeCredits += Math.floor(performance.audience / 5);
    }

    return volumeCredits;
  }
};
```

최상위 statement() 함수는 단 7줄이며, 출력할 문장만 생상하는 일만 한다. 계산 함수 또한 모두 여러개의 보조 함수로 빼내어 결과적으로 각 계산 과정은 물론 전체 흐름 또한 이해하기 쉬워졌다.

## 1.6 계산 단계와 포맷팅 단계 분리하기

이제 골격은 충분히 계선 되었으니 statement()의 HTML 버전을 만드는 작업을 살펴보자. 계산 코드가 모두 분리되었기 때문에 일곱 줄짜리 최상단 코드에 대응하는 HTML 버전만 작성하면 된다.

하지만, 분리된 계산 함수들이 모두 statement() 안에 중첩 함수로 존재하고 있다는 문제가 있다. 먼저 이를 **단계 쪼개기**를 통해 해결해보자.

이번 **단계 쪼개기**의 목표는 statemnet()의 로직을 두 단계로 나누는 것이다. 첫 단계에서는 satement()에 필요한 데이터를 처리하고, 다음 단계에서는 앞서 처리한 결과를 HTML로 표현하도록 하자.

이를 하기 위해 먼저 statement()를 분리해보자.

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  return renderPlainText(invoice, plays);
};

function renderPlainText(invoice: InvoiceType.Invoice, plays: PlayType.Plays) {
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;

  for (let perf of invoice.performances) {
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
  }

  result += `총액: ${usd(totalAmount())}\n`;
  result += `적립 포인트: ${totalVolumeCredits()}점\n`;

  return result;

  function totalAmount() { ... }

  function totalVolumeCredits() { ... }

  function usd(number: number): string { ... }

  function playFor(
    performance: InvoiceType.PerformanceInfo
  ): PlayType.PlayInfo { ... };

  function amountFor(
    performance: InvoiceType.PerformanceInfo
  ): number { ... };

  function volumeCreditsFor(
    performance: InvoiceType.PerformanceInfo
  ): number { ... }
}
```

다음으로 두 단계 사이의 중간 데이터 구조 역할을 할 객체를 만들어 renderPlainText()에 인수로 전달한다.

해당 객체는 고객 데이터와 공연 정보를 가짐으로 renderPlainText()에서 필요 없어질 invoice 인수는 제거한다.

> statement()

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  const statementData: StatementType.StatementData = {
    customer: invoice.customer,
    performances: invoice.performances
  };

  return renderPlainText(statementData, plays);
};
```

> readerPlainText()

```ts
function renderPlainText(data: StatementType.StatementData, plays: PlayType.Plays) {
  let result: string = `청구 내역 (고객명: ${data.customer})\n`;

  for (let perf of data.performances) {
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
  }

  result += `총액: ${usd(totalAmount())}\n`;
  result += `적립 포인트: ${totalVolumeCredits()}점\n`;

  return result;
}
```
