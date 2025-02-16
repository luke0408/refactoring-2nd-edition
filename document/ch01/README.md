# Ch01. 리팩터링: 첫 번째 예시

> 해당 장의 모든 코드는 아래의 위치에 존재합니다.
> - [소스 코드](../../src/ch01/)
> - [테스트 코드](../../test/ch01/)

해당 책에서는 리팩터링을 설명할 때 원칙을 나열해서 설명하기보다 간단한 예제를 통해 설명하고자 합니다. 사실 예제 코드들이 너무 간단하여 모든 리팩터링 원칙을 적용할 필요는 없으나, 그 코드가 대규모 시스템의 일부라면 리팩터링을 하고 안 하고의 차이가 큽니다.

따라서 각 예제 코드는 `대규모 시스템에서 발췌한 코드`라고 가정하고 진행됩니다.

## 1.1 자, 시작해 봅시다.

다양한 연극을 외주로 받아서 공연하는 극단이 있다고 가정해 봅시다. 공연 요청이 들어오면 연극의 장르와 관객 규모를 기초로 비용을 책정합니다.

현재 이 극단은 두 가지 장르, 비극(tragedy)과 희극(comedy)만 공연합니다. 그리고 공연료와 별개로 포인트(volume credit)를 지급하여 다음번 의뢰 시 공연료를 할인받을 수 있습니다.

극단은 공연할 연극 정보를 다음과 같이 간단한 JSON 파일에 저장합니다.

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

공연료 청구서에 들어갈 데이터도 다음과 같이 JSON 파일로 표현합니다.

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

> [!NOTE]
> 연극 정보는 JSON 형식으로 저장되며, 공연 청구서를 생성하는 데 활용됩니다.

### 공연료 청구서 생성 코드

공연료 청구서를 출력하는 코드는 다음과 같이 `statement()` 함수로 구현됩니다.

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

    // 포인트를 제공합니다.
    volumeCredits += Math.max(perf.audience - 30, 0);

    // 희극 관객 5명마다 추가 포인트를 제공합니다.
    if ('comedy' === play?.type) volumeCredits += Math.floor(perf.audience / 5);

    // 청구 내역을 출력합니다.
    result += ` ${play?.name}: ${format(thisAmount / 100)} (${perf.audience}석)\n`;
    totalAmount += thisAmount;
  }

  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;

  return result;
};
```

> [!IMPORTANT]
> 이 코드의 문제점은 공연 장르가 추가될 경우, switch 문을 수정해야 한다는 점입니다.

출력 결과는 다음과 같습니다.

```text
청구내역 (고객명: BigCo)
 Hamlet: $650.00 (55석)
 As You Like It: $580.00 (35석)
 Othello: $500.00 (40석)
총액: $1,730.00
적립 포인트: 47점
```

> [!WARNING]
> 현재 코드에서는 새로운 연극 장르가 추가될 경우, `statement()` 함수를 직접 수정해야 하는 구조적 문제가 있습니다.

## 1.2 예시 프로그램을 본 소감

처음 코드만 보면 특별한 문제가 없어 보이지만, 유지보수성과 확장성을 고려하면 개선이 필요합니다. 

현재 구조에서는 새로운 연극 장르가 추가될 때마다 `statement()` 함수의 switch 문을 수정해야 합니다. 이 방식은 코드의 유연성을 저하시킬 뿐만 아니라, 유지보수 비용을 증가시키는 원인이 됩니다.

또한, `statement()` 함수는 여러 가지 역할을 동시에 수행하고 있어 코드가 길어지고 가독성이 떨어집니다. 그 결과, 수정이 필요할 때 변경해야 할 부분을 찾기 어려워지고, 실수할 가능성이 커집니다.

### 해결 방법

이 문제를 해결하려면 **리팩터링을 통해 코드의 구조를 개선**해야 합니다. 

- **장르별 계산 로직 분리:** 각 장르의 계산 방식을 별도의 함수나 클래스로 분리하면, 새로운 연극 장르가 추가되더라도 기존 코드를 수정할 필요 없이 확장할 수 있습니다.
- **가독성 및 유지보수성 향상:** 코드가 논리적으로 정리되면 이해하기 쉬워지고, 수정해야 할 부분을 빠르게 찾을 수 있습니다.

> [!CAUTION]
> 코드가 복잡해질수록 유지보수 비용이 증가할 수 있습니다. 리팩터링을 통해 가독성과 유지보수성을 지속적으로 개선하는 것이 중요합니다.

리팩터링 과정에서는 다음과 같은 기법을 활용할 수 있습니다:

- **함수 추출하기:** 중복된 코드나 특정 역할을 수행하는 부분을 별도의 함수로 분리합니다.
- **변수 인라인하기:** 불필요한 변수를 제거하여 코드를 간결하게 만듭니다.
- **다형성 적용:** 조건문 대신 클래스를 활용하여 확장성을 높입니다.

이러한 기법들을 활용하면 코드의 품질을 높이고, 미래의 변경을 보다 쉽게 할 수 있습니다.

## 1.3 리팩토링의 첫 단계

리팩토링의 첫 단계는 코드가 잘 작동하는지 확인해줄 테스트 코드를 만드는 것입니다.

statement() 함수에 대한 테스트 코드는 다음과 같이 작성했습니다.

> [!NOTE]
> 테스트 코드를 작성하는 것은 리팩토링의 중요한 첫 단계로, 코드가 예상대로 작동하는지 검증할 수 있는 방법을 제공합니다.

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

  it('statement는 string 결과 값을 도출할 수 있습니다.', async () => {
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

위 테스트 코드는 [jest](https://jestjs.io/) 라이브러리를 사용해 작성했으며 `npm run test`를 통해 실행 가능합니다.

> [!TIP]
> `jest`는 자바스크립트 코드의 테스트를 작성하고 실행할 수 있는 강력한 테스팅 프레임워크입니다. `npm run test` 명령어를 사용하여 테스트를 자동화하고, 코드 변경 후 결과를 빠르게 확인할 수 있습니다.

## 1.4 statement() 함수 쪼개기

`statement()` 함수 중간에는 `switch` 문이 있습니다. 이 `switch` 문을 살펴보면 한 번의 공연에 대한 요금을 계산하고 있습니다.

> [!IMPORTANT]  
> `statement()` 함수의 `switch` 문  

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

이러한 사실은 코드 분석을 하면서 얻은 정보입니다.

> [!NOTE]  
> **워드 커닝햄(Ward Cunningham)**은 다음과 같이 말했습니다.  
> > "이런 식으로 파악한 정보는 휘발성이 높기로 악명 높은 저장 장치인 내 머릿속에 기록되므로, 잊지 않으려면 재빨리 코드에 반영해야 한다."

이렇게 하면 다음번에 코드를 볼 때, 다시 분석하지 않아도 코드 스스로가 자신이 하는 일이 무엇인지 이야기해줄 것입니다.

### 함수 추출하기

여기서는 **코드 조각을 별도 함수로 추출**하는 방식으로 앞서 파악한 정보를 코드에 반영할 것입니다.

추출한 함수에는 그 코드가 하는 일을 설명하는 이름을 지어줍니다. 예를 들어, `amountFor(performance)`라는 이름이 적절해 보입니다.

별도 함수로 뽑았을 때 **유효범위를 벗어나는 변수**(즉, 새 함수에서 필요한 변수)를 확인해 보겠습니다.

- `performance`
- `play`
- `thisAmount`

이 중에서 `performance`와 `play`는 값을 **참조만** 하기 때문에 **새 함수의 파라미터로 전달**하면 됩니다.  
그러나 `thisAmount`는 새 함수에서 변경되므로 주의해야 합니다.

> [!CAUTION]  
> `thisAmount`는 새 함수에서 값을 변경합니다.  
> 따라서 **새 함수에서 선언하고 리턴**하는 방식으로 처리해야 합니다.

#### 리팩토링된 코드

> `statement()` 함수

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

    // 포인트를 제공합니다.
    volumeCredits += Math.max(perf.audience - 30, 0);

    // 희극 관객 5명마다 추가 포인트를 제공합니다.
    if ('comedy' === play?.type) volumeCredits += Math.floor(perf.audience / 5);

    // 청구 내역을 출력합니다.
    result += ` ${play?.name}: ${format(thisAmount / 100)} (${perf.audience}석)\n`;
    totalAmount += thisAmount;
  }

  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;

  return result;
};
```

> `amountFor()` 함수

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

#### 테스트 실행

> [!NOTE]  
> 이제 테스트를 실행하여 코드가 정상적으로 작동하는지 확인해 보겠습니다.  
> (이후에는 테스트 코드가 변경되는 지점에서만 테스트 결과를 첨부하겠습니다.)

```bash
$ ~/refactoring-2nd-edition{master}$ npm run test

> refactoring@0.0.0 test
> jest

 PASS  test/ch01/statement.spec.ts (6.629 s)
  StatementTest
    ✓ statement는 string 결과 값을 도출할 수 있습니다. (24 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        6.736 s, estimated 7 s
Ran all test suites.
```

#### 변수 이름 개선

`thisAmount`라는 변수명은 계산된 요금을 담는 변수입니다.
더 직관적인 `result`로 이름을 변경하면 가독성이 향상될 것입니다.

### Play 변수 제거하기

`amountFor()`의 매개변수를 살펴보면서 이 값들이 어디서 오는지 알아봅시다.  

`performance`는 반복문을 돌 때마다 변경되는 값이지만, `play`는 개별 공연(`performance`)에서 가져올 수 있으므로 **매개변수로 전달할 필요가 없습니다.**  

> [!TIP]  
> **로컬 범위의 변수를 줄이면 함수 추출이 쉬워집니다.**  
> - 지역 변수를 줄이면 유효 범위를 신경 쓸 대상이 줄어듭니다.  
> - 그 결과 **함수 추출 작업이 간단해지고 가독성이 향상**됩니다.

#### 해결 방법: `playFor()` 함수 추가

우리는 `play` 값을 직접 매개변수로 전달하는 대신, **해당 값을 반환하는 별도 함수를 만들고 `amountFor()` 내부에서 호출**하면 됩니다.

> [!IMPORTANT]  
> 마틴 파울러는 긴 함수를 잘게 쪼갤 때마다 `play` 같은 변수를 **최대한 제거**합니다.  
> 임시 변수들이 많아지면 **추출 작업이 복잡해질 수 있기 때문입니다.**

#### `playFor()` 함수 추가

> playFor()

```ts
function playFor(
  performance: InvoiceType.PerformanceInfo
): PlayType.PlayInfo {
  return plays[performance.playID];
};
```

이제 `statement()` 함수에서 `play` 변수를 직접 사용하지 않고 `playFor()` 함수를 호출하도록 수정할 수 있습니다.

#### 변경된 `statement()` 함수

> [!NOTE]  
> `play` 변수를 **직접 사용하지 않고 `playFor(perf)`를 호출**하도록 변경하였습니다.

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
    const play = playFor(perf); // <-- `playFor()` 함수 사용
    let thisAmount = 0;

    thisAmount = amountFor(play, perf);

    // 포인트를 제공합니다.
    volumeCredits += Math.max(perf.audience - 30, 0);

    // 희극 관객 5명마다 추가 포인트를 제공합니다.
    if ('comedy' === play?.type) volumeCredits += Math.floor(perf.audience / 5);

    // 청구 내역을 출력합니다.
    result += ` ${play?.name}: ${format(thisAmount / 100)} (${perf.audience}석)\n`;
    totalAmount += thisAmount;
  }
  
  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
};
```

이제 `statement()` 함수에서 `play`를 **지역 변수로 선언할 필요가 없어졌습니다.**  
따라서 **"변수 인라인 하기" 리팩토링**을 적용하여 매개변수를 제거할 수 있습니다.

#### 매개변수 `play`와 `thisAmount` 제거

> [!WARNING]  
> **매개변수가 많아질수록 함수의 복잡도가 증가합니다.**  
> - 불필요한 매개변수는 제거하는 것이 좋습니다.  
> - `play`와 `thisAmount`를 제거하면 코드가 더욱 직관적으로 변합니다.

> 변경된 `amountFor()` 함수

```ts
function amountFor (
  performance: InvoiceType.PerformanceInfo
): number {
  let thisAmount: number = 0;
  switch (playFor(performance).type) {  // <-- playFor() 직접 호출
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

#### 최종 `statement()` 함수

이제 `statement()` 함수에서도 **"변수 인라인 하기"** 기법을 적용하여 `play`와 `thisAmount`를 직접 변수로 선언하지 않고 `playFor(perf)`와 `amountFor(perf)`를 직접 호출하도록 변경하였습니다.

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
    // 포인트를 제공합니다.
    volumeCredits += Math.max(perf.audience - 30, 0);

    // 희극 관객 5명마다 추가 포인트를 제공합니다.
    if ('comedy' === playFor(perf).type) volumeCredits += Math.floor(perf.audience / 5);

    // 청구 내역을 출력합니다.
    result += ` ${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }
  
  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
}
```


### 적립 포인트 계산 코드 추출하기

이제 `statement()` 함수에서 **적립 포인트 계산 코드**를 별도 함수로 추출할 차례입니다.  
아직 처리해야 할 변수가 **두 개** 더 남아 있습니다.

#### 변수 분석
1. **`perf`**  
   - 값만 참조하면 되므로 **인라인으로 처리 가능**
2. **`volumeCredits`**  
   - 반복문을 돌 때마다 값을 **누적해야 하므로 신경 써야 함**

> [!WARNING]  
> `volumeCredits`처럼 **누적되는 값**을 다룰 때는 주의가 필요합니다.  
> - 새 함수에서 `volumeCredits`를 초기화한 후 값을 반환하는 방식이 적절합니다.

이를 해결하기 위해 **적립 포인트를 계산하는 `volumeCreditsFor()` 함수를 추출**하겠습니다.

#### `volumeCreditsFor()` 함수 추출
 
**적립 포인트 계산 로직을 별도 함수로 분리하면** `statement()` 함수가 더 간결해지고 가독성이 향상됩니다.

또한, 적립 포인트 계산 로직을 독립적으로 수정·테스트할 수 있습니다.

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

#### 변경된 `statement()` 함수

이제 `statement()`에서 직접 적립 포인트를 계산하지 않고, `volumeCreditsFor(perf)`를 호출하도록 수정합니다.

`volumeCredits += volumeCreditsFor(perf);` 한 줄을 추가하여 적립 포인트 계산이 자동으로 수행되도록 할 수 있습니다.

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
    volumeCredits += volumeCreditsFor(perf); // ✅ 적립 포인트 계산 함수 호출

    // 청구 내역을 출력합니다.
    result += ` ${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }
  
  result += `총액: ${format(totalAmount / 100)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
}
```

### format 변수 제거하기

앞에서 설명했듯이 **임시 변수**는 루틴이 길고 복잡할수록 문제가 될 수 있습니다.  
임시 변수는 자신이 속한 루틴에서만 의미가 있어서 **불필요한 지역 변수**가 늘어나고 유지보수가 어려워집니다.  

> [!WARNING]  
> **임시 변수를 줄이면 코드 가독성이 향상됩니다.**  
> - 지역 변수는 함수 내부에서만 의미가 있어 유지보수가 어렵습니다.  
> - 되도록 **질의 함수로 변환하여 직접 호출**하는 것이 좋습니다.

#### `format`을 별도 함수로 추출

임시 변수였던 `format`을 별도 함수로 분리하고,  
**함수 이름을 `usd`로 변경**하여 기능을 더 명확하게 표현하겠습니다.

> [!IMPORTANT]  
> - **"화폐 단위 변환"을 하는 함수이므로** 보다 명확한 `usd()`라는 이름을 사용  
> - **공통적으로 들어가는 `/ 100` 연산을 함수 내부로 이동**하여 중복 제거

> 변경된 `usd()` 함수

```ts
function usd(number: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(number / 100);
}
```

> 변경된 `statement()` 함수

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

    // 청구 내역을 출력합니다.
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }
  
  result += `총액: ${usd(totalAmount)}\n`;
  result += `적립 포인트: ${volumeCredits}점\n`;
  
  return result;
}
```

### volumeCredits 변수 제거하기

적립 포인트(`volumeCredits`)는 **반복문을 돌 때마다 값을 누적**해야 하기 때문에,  
리팩토링이 까다롭습니다.  
먼저 **반복문 쪼개기**를 수행하여 `volumeCredits` 값을 누적하는 부분을 분리하겠습니다.

> [!TIP]  
> **"반복문 쪼개기" 기법을 사용하면 코드의 역할이 명확해집니다.**  
> - 반복문 하나에서는 **청구 내역을 출력**  
> - 다른 반복문에서는 **적립 포인트를 계산**

1️⃣ 반복문 쪼개기

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  let totalAmount: number = 0;
  let volumeCredits: number = 0;
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;

  for (let perf of invoice.performances) {
    // 청구 내역을 출력합니다.
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

> [!CAUTION]  
> **반복문을 추가하면 성능이 느려지지 않을까?**  
> - 최신 컴파일러는 최적화를 자동으로 수행합니다.  
> - 따라서 반복문을 쪼갠다고 해서 성능이 크게 저하되지 않습니다.  
> - 실제 테스트에서도 **성능 차이가 거의 없었습니다.**

#### volumeCredits 변수를 별도 함수로 추출하기

> [!NOTE]  
> **이제 "변수 인라인 하기"를 쉽게 적용할 수 있습니다.**  
> - `volumeCredits`를 별도 함수로 추출하여 `totalVolumeCredits()` 함수로 변환  
> - 반복문 내부에서 직접 계산하는 것이 아니라 **함수 호출로 대체**

2️⃣ `totalVolumeCredits()` 함수 추가

```ts
function totalVolumeCredits(): number {
  let volumeCredits: number = 0;
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
  }
  return volumeCredits;
}
```

3️⃣ `statement()`에서 `volumeCredits` 변수 제거

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  let totalAmount: number = 0;
  let result: string = `청구 내역 (고객명: ${invoice.customer})\n`;
  
  for (let perf of invoice.performances) {
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience}석)\n`;
    totalAmount += amountFor(perf);
  }
  
  result += `총액: ${usd(totalAmount)}\n`;
  result += `적립 포인트: ${totalVolumeCredits()}점\n`;
  
  return result;
}
```

### totalAmount 변수 제거하기

이제 **totalAmount 변수도 제거**할 차례입니다.  
앞에서 진행한 **"변수 인라인하기"** 기법을 동일하게 적용하면 됩니다.

> [!TIP]  
> **totalAmount 변수도 totalVolumeCredits와 같은 방식으로 제거할 수 있습니다.**

#### `totalAmount()` 함수 추가

```ts
function totalAmount(): number {
  let result: number = 0;
  for (let perf of invoice.performances) {
    result += amountFor(perf);
  }
  return result;
}
```

#### 최종 `statement()` 함수

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

지금까지의 코드를 한번 전체적으로 살펴봅시다.  

현재 `statement()` 함수는 **출력할 문장을 생성하는 역할만 수행**하며, 실제 계산 로직은 **여러 개의 보조 함수로 분리**되었습니다.

> [!TIP]  
> **리팩토링의 핵심 목표는 "가독성"과 "유지보수성" 향상**  

### 변경된 `statement()` 함수

```ts
import { InvoiceType, PlayType } from '../types';

/**
 * 연극에 대한 청구 내역과 총액, 적립 포인트를 반환합니다.
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
   * 총액을 계산합니다.
   * 
   * @returns 총 금액
   */
  function totalAmount(): number {
    let result: number = 0;
    for (let perf of invoice.performances) {
      result += amountFor(perf);
    }
    return result;
  }

  /**
   * 적립 포인트를 계산합니다.
   * 
   * @returns 총 적립 포인트
   */
  function totalVolumeCredits(): number {
    let result: number = 0;
    for (let perf of invoice.performances) {
      result += volumeCreditsFor(perf);
    }
    return result;
  }

  /**
   * USD 화폐 단위로 변환합니다.
   * 
   * @param number 원본 숫자
   * @returns 변환된 화폐 값
   */
  function usd(number: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(number / 100);
  }

  /**
   * 공연 정보를 조회합니다.
   * 
   * @param performance 공연 정보
   * @returns 해당 공연의 play 정보
   */
  function playFor(
    performance: InvoiceType.PerformanceInfo
  ): PlayType.PlayInfo {
    return plays[performance.playID];
  };

  /**
   * 개별 공연의 청구 금액을 계산합니다.
   * 
   * @param performance 공연 정보
   * @returns 해당 공연의 금액
   */
  function amountFor(
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
   * 적립 포인트를 계산합니다.
   * 
   * @param performance 공연 정보
   * @returns 적립 포인트
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

### 리팩토링 결과

> [!NOTE]  
> **최상위 `statement()` 함수는 단 7줄**  
> - 오직 **출력할 문장을 생성하는 역할만 수행**  
> - 계산 함수는 **모두 보조 함수로 분리되어 유지보수가 용이**  
> - 전체 흐름이 **이해하기 쉬운 구조로 정리됨**  

지금까지의 리팩토링을 통해 **가독성과 유지보수성이 대폭 향상**되었습니다. 🚀

## 1.6 계산 단계와 포맷팅 단계 분리하기

이제 `statement()` 함수의 **HTML 버전**을 만들어 보겠습니다.  
다행히, **계산 코드가 이미 모두 분리**되었기 때문에  
**최상단 코드(`statement()`)에 대응하는 HTML 버전만 추가**하면 됩니다.

> [!WARNING]  
> 하지만, 현재 **모든 계산 함수가 `statement()` 안에 중첩 함수로 존재**합니다.  
> - 이를 **단계 쪼개기(Decomposing Stage)** 기법을 사용하여 해결합니다.  
> - `statement()`의 로직을 **"계산 단계"와 "출력 단계"**로 분리합니다.

### **계산 로직과 출력 로직 분리**

첫 번째 단계에서는 `statement()`에 필요한 데이터를 처리하고,  
두 번째 단계에서는 **이 데이터를 기반으로 HTML을 출력**하도록 변경합니다.

> `statement()`를 `renderPlainText()`로 분리

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
  function playFor(performance: InvoiceType.PerformanceInfo): PlayType.PlayInfo { ... }
  function amountFor(performance: InvoiceType.PerformanceInfo): number { ... }
  function volumeCreditsFor(performance: InvoiceType.PerformanceInfo): number { ... }
}
```

> [!IMPORTANT]  
> **이제 `statement()`는 `renderPlainText()`를 호출하는 역할만 수행**합니다.  
> - `renderPlainText()`가 계산 결과를 받아서 **출력을 담당**하도록 분리되었습니다.  
> - 이제 **두 단계 사이에 중간 데이터를 전달할 수 있는 구조가 마련**되었습니다.

### **중간 데이터 구조 생성**

출력 데이터를 만들기 전에,  
**계산된 데이터를 저장할 중간 데이터 구조**를 만들겠습니다.  
이제 `statement()`의 인자로 **invoice를 직접 전달하는 것이 아니라**  
`statementData`라는 중간 데이터 객체를 전달하도록 변경합니다.

> `statement()` 변경

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

> `renderPlainText()` 변경

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

> [!TIP]  
> **이제 `renderPlainText()`는 `statementData`에서 데이터를 읽어와 출력만 담당**합니다.  
> - 따라서 `invoice`를 직접 전달할 필요가 없어졌습니다.

### **연극 제목을 중간 데이터 구조에 추가**

연극 제목을 `statementData`에서 가져올 수 있도록  
**공연 정보 레코드에 연극 데이터를 추가**하겠습니다.

> `statement()` 수정

```ts
export function statement (
  invoice: InvoiceType.Invoice, 
  plays: PlayType.Plays
): string {
  const statementData: StatementType.StatementData = {} as StatementType.StatementData;
  statementData.customer = invoice.customer;
  statementData.performances = invoice.performances.map(enrichPerformance);

  return renderPlainText(statementData, plays);

  function enrichPerformance(performance: InvoiceType.PerformanceInfo): StatementType.PerformanceInfo {
    const result = Object.assign({}, performance) as StatementType.PerformanceInfo;
    return result;
  }
}
```

### **계산 데이터를 `statementData`에 추가**

이제 `playFor()`, `amountFor()`, 그리고 적립 포인트 계산 부분을  
`statement()`에 옮기고,  
`renderPlainText()`에서 해당 함수를 사용하던 부분을  
**중간 데이터를 사용하도록 수정**합니다.

> `statement()` 변경

```ts
export function statement(invoice: InvoiceType.Invoice, plays: PlayType.Plays): string {
  const statementData: StatementType.StatementData = {} as StatementType.StatementData;
  statementData.customer = invoice.customer;
  statementData.performances = invoice.performances.map(enrichPerformance);
  statementData.totalAmount = totalAmount(statementData);
  statementData.totalVolumeCredits = totalVolumeCredits(statementData);

  return renderPlainText(statementData, plays);

  function enrichPerformance(performance: InvoiceType.PerformanceInfo): StatementType.PerformanceInfo {
    const result = Object.assign({}, performance) as StatementType.PerformanceInfo;
    result.play = playFor(result);
    result.amount = amountFor(result);
    result.volumeCredits = volumeCreditsFor(result);
    return result;
  }
}
```

> `renderPlainText()` 변경

```ts
function renderPlainText(data: StatementType.StatementData, plays: PlayType.Plays) {
  let result: string = `청구 내역 (고객명: ${data.customer})\n`;

  for (let perf of data.performances) {
    result += ` ${perf.play.name}: ${usd(perf.amount)} (${perf.audience}석)\n`;
  }

  result += `총액: ${usd(data.totalAmount)}\n`;
  result += `적립 포인트: ${data.totalVolumeCredits}점\n`;

  return result;
}
```

### **HTML 버전 추가**

이제 `htmlStatement()`를 추가하여 HTML 버전을 출력할 수 있도록 합니다.

> `htmlStatement()`

```ts
export function htmlStatement(invoice: InvoiceType.Invoice, plays: PlayType.Plays): string {
  return renderHtml(createStatementData(invoice, plays));
}
```

> `renderHtml()`

```ts
function renderHtml(data: StatementType.StatementData) {
  let result = `<h1>청구 내역 (고객명: ${data.customer})</h1>\n`;
  result += '<table>\n';
  result += '<tr><th>연극</th><th>좌석 수</th><th>금액</th></tr>';
  for (let perf of data.performances) {
    result += `<tr><td>${perf.play.name}</td><td>(${perf.audience}석)</td>`;
    result += `<td>${usd(perf.amount)}</td></tr>\n`;
  }
  result += '</table>\n';
  result += `<p>총액: <em>${usd(data.totalAmount)}</em></p>\n`;
  result += `<p>적립 포인트: <em>${data.totalVolumeCredits}</em>점</p>\n`;

  return result;
}
```

## 1.7 중간 점검: 두 파일(과 두 단계)로 분리

지금까지 작성한 코드의 상태를 점검해봅시다.  
현재의 코드는 **두 개의 파일로 구성**됩니다.

- `statement/index.ts`: **출력 담당 (HTML 및 텍스트)**  
- `statement/createStatementData.ts`: **계산 담당**  

### **출력 로직 (`statement/index.ts`)**

> `statement/index.ts`  

```ts
import { InvoiceType, PlayType, StatementType } from '../types';
import { createStatementData } from './createStatementData';

/**
 * 연극에 대한 청구 내역과 총액, 적립 포인트를 반환합니다.
 */
export function statement(invoice: InvoiceType.Invoice, plays: PlayType.Plays): string {
  return renderPlainText(createStatementData(invoice, plays));
}

/**
 * 연극에 대한 청구 내역과 총액, 적립 포인트를 HTML의 형태로 반환합니다.
 */
export function htmlStatement(invoice: InvoiceType.Invoice, plays: PlayType.Plays): string {
  return renderHtml(createStatementData(invoice, plays));
}
```

> [!NOTE]  
> `statement()`와 `htmlStatement()`가 동일한 `createStatementData()`를 사용하므로,  
> **계산 로직을 중복하지 않고도 HTML 버전을 추가할 수 있습니다.**  

---

### **계산 로직 (`statement/createStatementData.ts`)**

> `statement/createStatementData.ts`

```ts
import { InvoiceType, PlayType, StatementType } from '../types';

/**
 * statement에 필요한 데이터를 처리합니다.
 */
export function createStatementData(invoice: InvoiceType.Invoice, plays: PlayType.Plays) {
  const result: StatementType.StatementData = {} as StatementType.StatementData;
  result.customer = invoice.customer;
  result.performances = invoice.performances.map(enrichPerformance);
  result.totalAmount = totalAmount(result);
  result.totalVolumeCredits = totalVolumeCredits(result);
  return result;

  /**
   * 공연 정보를 추가합니다.
   */
  function enrichPerformance(performance: InvoiceType.PerformanceInfo): StatementType.PerformanceInfo {
    const result = Object.assign({}, performance) as StatementType.PerformanceInfo;
    result.play = playFor(result);
    result.amount = amountFor(result);
    result.volumeCredits = volumeCreditsFor(result);

    return result;
  }
}
```

> [!NOTE]  
> **모든 계산 로직이 `createStatementData()`에 모여 있어 유지보수가 쉬워졌습니다.**  
> - 새로운 요구사항이 추가되더라도, **출력 로직을 수정할 필요 없이**  
> - **계산 로직만 변경하면 됩니다.**  

### **모듈화를 통한 코드 개선**

처음보다 코드량은 늘어났지만,  
**모듈화를 통해 코드의 역할이 명확해졌고 유지보수가 쉬워졌습니다.**

**좋은 코드란 간결한 코드가 아니라, 명료한 코드입니다.** 코드가 명료하면, **수정과 확장이 쉬워집니다.** 또한, 불필요한 코드 중복 없이 **기능을 추가할 수 있습니다.**  

### **리팩토링을 마친 후의 원칙**

**코드를 개선하는 것은 단순히 줄이는 것이 아닙니다.** 코드를 줄이려고 하면 **가독성과 유지보수성이 떨어질 수 있습니다.** 

오히려 **명확하게 분리하는 것이 더 좋은 코드**입니다.  

> [!NOTE]  
> **"캠핑장 원칙"을 적용합시다.**  
> - **"도착했을 때보다 깔끔하게 정돈하고 떠난다."**  
> - 프로그래밍도 마찬가지로, **작업을 끝낸 후 코드베이스를 더 건강하게 유지해야 합니다.**  

### **리팩토링을 멈출 타이밍**

출력 로직을 더 간결하게 만들 수도 있지만,  
**마틴 파울러는 여기서 멈추는 것을 추천합니다.**

> [!IMPORTANT]  
> 리팩토링과 기능 개발 사이의 **균형을 맞추는 것이 중요합니다.**  
> - 지금 상태에서 코드가 **충분히 개선되었으며 유지보수성이 확보됨**  
> - 불필요한 리팩토링으로 **더 복잡해질 위험이 있음**  

현재의 코드 상태에서 **기능을 추가해야 할 필요가 있을 때**  
다시 리팩토링을 고려하는 것이 더 좋은 접근입니다.

## 1.8 다형성을 활용해 계산 코드 재구성 하기

[요구사항 추가!]
- 연극의 장르가 늘어납니다.
- 각 장르마다 공연료와 적립 포인트 계산법이 상이합니다.

새롭게 요구 사항이 추가가되었습니다. 현재 상태의 코드에서 변경하려면 이 계산을 수행하는 함수에서 조건문을 수정해야합니다. amountFor() 함수를 보면 연극 장르에 따라 계산 방식이 달라진다는 것을 알 수 있는데, 이런 형태의 조건부 로직은 코드 수정 횟수가 늘어날수록 골칫거리로 전락하기 쉽다. 

우선 이 조건부 로직을 수정해봅시다. 수 많은 조건부 로직 보완 방법이 있지만, 여기서는 객체지향의 핵심 특성인 다형성(ploymorphism)을 활용해봅시다.

[작업 목표]
- 상속 계층을 구성해서 희극 서브 클래스와 비극 서브 클래스가 각자의 구체적인 계산 로직을 정의 하도록 합니다.
- 호출 하는 쪽에서는 다형성 버전의 공연료 계산 함수를 호출하기만 하면 되도록 하여 희극이냐 비극이냐에 따라 정확한 계산 로직을 연결하는 것은 언어차원에서 지원 받도록 합니다.
- 적립 포인트의 조건부 로직도 위와 같은 형태로 수정합니다.

위 리팩토링 기법을 사용하려면 우선 상속 계층부터 정의해야합니다. 즉, 공연료와 적립 포인트 계산 함수를 담을 클래스가 필요합니다.

### 공연료 계산기 만들기

이번 작업의 핵심은 각 공연의 정보를 중간 데이터 구조에 채워주는 enrichPerformance() 입니다. 현재 이 함수는 조건부 로직을 포함한 함수인 amountFor()과 volumeCreditsFor()를 호출하고 있습니다.

이번에 할 일은 이 두 함수를 전용 클래스로 옮기는 작업이며, 이 클래스는 공연 관련된 데이터를 계산하는 함수들로 구성됨으로 공연료 계산기(PerformanceCalculator)라고 부르겠습니다.

> PerformanceCalculator

```ts
class PerformanceCalculator {
  constructor(
    performance: InvoiceType.PerformanceInfo,
    play: PlayType.PlayInfo
  ) {
    this.performance = performance;
    this.play = play;
  }

  performance: InvoiceType.PerformanceInfo;
  play: PlayType.PlayInfo;
}
```

> enrichPerformance()

```ts
function enrichPerformance(performance: InvoiceType.PerformanceInfo): StatementType.PerformanceInfo {
  const calculator = new PerformanceCalculator(performance, playFor(performance));
  const result = Object.assign({}, performance) as StatementType.PerformanceInfo;
  result.play = calculator.play;
  result.amount = amountFor(result);
  result.volumeCredits = volumeCreditsFor(result);
  return result;
}
```

### 함수들을 계산기로 옮기기

클래스를 생성했으니 이제 내부 로직을 옮겨봅시다. 우선 공연료 계산 코드를 계산기 클래스 안으로 복사합니다.

> PerformanceCalculator 클래스

```ts
class PerformanceCalculator {
  
  ...

  public get amount() : number {
    let result: number = 0;
    switch (this.play.type) {
      case 'tragedy':
        result = 40000;
        if (this.performance.audience > 30) {
          result += 1000 * (this.performance.audience - 30);
        }
        break;
      case 'comedy':
        result = 30000;
        if (this.performance.audience > 20) {
          result += 10000 + 500 * (this.performance.audience - 20);
        }
        result += 300 * this.performance.audience;
        break;
      default:
        throw new Error(`알 수 없는 장르: ${this.play.type}`);
    }
    return result;
  }
}
```

이후 원본 함수가 방금 만든 함수로 작업을 위임 하도록 합니다.

```ts
function amountFor(performance: StatementType.PerformanceInfo): number {
  return new PerformanceCalculator(performance, playFor(performance)).amount;
}
```

테스트를 통해 문제가 없음을 확인했다면 함수 인라인하여 새 함수를 직접 호출하도록 합니다.

> 테스트 결과

```bash
$ ~/refactoring-2nd-edition{master}$ npm run test

> refactoring@0.0.0 test
> jest

 PASS  test/ch01/statement.spec.ts (6.793 s)
  StatementTest
    ✓ statement는 string 결과 값을 도출할 수 있습니다. (35 ms)
    ✓ statement는 html 결과 값을 도출할 수 있습니다. (1 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        6.888 s
Ran all test suites.
```

> enrichPerformance()

```ts
function enrichPerformance(performance: InvoiceType.PerformanceInfo): StatementType.PerformanceInfo {
  const calculator = new PerformanceCalculator(performance, playFor(performance));
  const result = Object.assign({}, performance) as StatementType.PerformanceInfo;
  result.play = calculator.play;
  result.amount = calculator.amount;
  result.volumeCredits = volumeCreditsFor(result);
  return result;
}
```

적립 포인트를 계산하는 함수도 같은 방법으로 옮깁니다.

> enrichPerformance()

```ts
function enrichPerformance(performance: InvoiceType.PerformanceInfo): StatementType.PerformanceInfo {
  const calculator = new PerformanceCalculator(performance, playFor(performance));
  const result = Object.assign({}, performance) as StatementType.PerformanceInfo;
  result.play = calculator.play;
  result.amount = calculator.amount;
  result.volumeCredits = calculator.volumeCredits; // 함수 인라인 적용
  return result;
}
```

> PerformanceCalculator 클래스

```ts
class PerformanceCalculator {
  
  ...

  public get volumeCredits(): number {
    let volumeCredits = 0;
    volumeCredits += Math.max(this.performance.audience - 30, 0);

    if ('comedy' === this.play.type) {
      volumeCredits += Math.floor(this.performance.audience / 5);
    }

    return volumeCredits;
  }
}
```

### 공영료 계산기를 다형성 버전으로 만들기

클래스에 로직을 담았으니 이제 다향성을 지원하도록 만들어봅시다. 가장 먼저 할 일은 타입 코드 대신 서브클래스를 사용하도록 하는 것입니다.

이렇게 하려면 PerformanceCalculator의 서브클래스들을 준비하고 createStatementData() 에서 그중 적합한 서브 클래스를 사용하게 만들어야 합니다.

이를 위해 먼저 생성자를 팩터리 함수로 바꾸었습니다.

> createPerformanceCalculator()

```ts
function createPerformanceCalculator(performance: InvoiceType.PerformanceInfo, play: PlayType.PlayInfo) {
  return new PerformanceCalculator(performance, play);
}
```

> enrichPerformance()

```ts
function enrichPerformance(performance: InvoiceType.PerformanceInfo): StatementType.PerformanceInfo {
  const calculator = createPerformanceCalculator(performance, playFor(performance)); // 팩터리 함수 적용
  const result = Object.assign({}, performance) as StatementType.PerformanceInfo;
  result.play = calculator.play;
  result.amount = calculator.amount;
  result.volumeCredits = calculator.volumeCredits;

  return result;
}
```

팩터리 함수를 사용하면 다음과 같이 PerformanceCalculator의 서브 클래스 중에서 어느 것을 생성해서 반환할지 선택할 수 있습니다.

> 팩터리 함수와 서브 클래스

```ts
function createPerformanceCalculator(performance: InvoiceType.PerformanceInfo, play: PlayType.PlayInfo) {
  switch (play.type) {
    case 'tragedy':
      return new TragedyCalculator(performance, play);
    case 'comedy':
      return new ComedyCalculator(performance, play);
    default:
      throw new Error(`알 수 없는 장르: ${play.type}`);
  }  
}

class TragedyCalculator extends PerformanceCalculator {
}

class ComedyCalculator extends PerformanceCalculator {
}
```

이제 조건부 로직을 다형성으로 바꾸어 봅시다.

> PerformanceCalculator

```ts
class PerformanceCalculator {
  constructor(performance: InvoiceType.PerformanceInfo, play: PlayType.PlayInfo) {
    this.performance = performance;
    this.play = play;
  }

  performance: InvoiceType.PerformanceInfo;
  play: PlayType.PlayInfo;

  public get amount(): number {
    throw new Error('서브 클래스에서 처리하도록 설계 되었습니다.');
  }

  public get volumeCredits(): number {
    return Math.max(this.performance.audience - 30, 0);
  }
}
```

> TragedyCalculator

```ts
class TragedyCalculator extends PerformanceCalculator {
  public get amount(): number {
    let result = 40000;
    if (this.performance.audience > 30) {
      result += 1000 * (this.performance.audience - 30);
    }

    return result;
  }
}
```

> ComedyCalculator

```ts
class ComedyCalculator extends PerformanceCalculator {
  public get amount(): number {
    let result = 30000;
    if (this.performance.audience > 20) {
      result += 10000 + 500 * (this.performance.audience - 20);
    }
    result += 300 * this.performance.audience;

    return result;
  }

  public get volumeCredits(): number {
    return super.volumeCredits + Math.floor(this.performance.audience / 5);
  }
}
```

amount()의 경우 각 서브 클래스 별로 계산을 진행하도록 하여, PerformanceCalculator 에서 직접 호출시 에러를 발생시키도록 하였다. 

volumeCredits()의 경우는 일부 장르에서만 약간씩 다를 뿐 대다수의 연극은 관객 수가 30을 넘는지 확인해야 하기 때문에 가장 일반적인 경우를 기본으로 하여 슈퍼클래스에 남겨두고 세부 내용은 오버라이드 하여 수정하도록 하였다.

## 1.9 상태 점검: 다형성을 활용하여 데이터 생성하기

다형성을 추가한 결과를 살펴봅시다.

```ts
import { InvoiceType, PlayType, StatementType } from '../types';

/**
 * statement에 필요한 데이터를 처리합니다.
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
   * 공연 정보를 추가합니다.
   *
   * @param performance
   * @returns
   */
  function enrichPerformance(performance: InvoiceType.PerformanceInfo): StatementType.PerformanceInfo {
    const calculator = createPerformanceCalculator(performance, playFor(performance));
    const result = Object.assign({}, performance) as StatementType.PerformanceInfo;
    result.play = calculator.play;
    result.amount = calculator.amount;
    result.volumeCredits = calculator.volumeCredits;

    return result;
  }

  /**
   * performance를 통해 play 값을 구합니다.
   *
   * @param performance
   * @returns
   */
  function playFor(performance: InvoiceType.PerformanceInfo): PlayType.PlayInfo {
    return plays[performance.playID];
  }

  /**
   * totalAmount를 구합니다.
   *
   * @returns
   */
  function totalAmount(data: StatementType.StatementData) {
    return data.performances.reduce((total, p) => total + p.amount, 0);
  }

  /**
   * volumeCredites를 구합니다.
   *
   * @returns
   */
  function totalVolumeCredits(data: StatementType.StatementData) {
    return data.performances.reduce((total, p) => total + p.volumeCredits, 0);
  }
}

/**
 * 공연 관련 데이터 계산 함수를 담당하는 클래스
 */
class PerformanceCalculator {
  constructor(performance: InvoiceType.PerformanceInfo, play: PlayType.PlayInfo) {
    this.performance = performance;
    this.play = play;
  }

  performance: InvoiceType.PerformanceInfo;
  play: PlayType.PlayInfo;

  public get amount(): number {
    throw new Error('서브 클래스에서 처리하도록 설계 되었습니다.');
  }

  public get volumeCredits(): number {
    return Math.max(this.performance.audience - 30, 0);
  }
}

function createPerformanceCalculator(performance: InvoiceType.PerformanceInfo, play: PlayType.PlayInfo) {
  switch (play.type) {
    case 'tragedy':
      return new TragedyCalculator(performance, play);
    case 'comedy':
      return new ComedyCalculator(performance, play);
    default:
      throw new Error(`알 수 없는 장르: ${play.type}`);
  }
}

class TragedyCalculator extends PerformanceCalculator {
  public get amount(): number {
    let result = 40000;
    if (this.performance.audience > 30) {
      result += 1000 * (this.performance.audience - 30);
    }

    return result;
  }
}

class ComedyCalculator extends PerformanceCalculator {
  public get amount(): number {
    let result = 30000;
    if (this.performance.audience > 20) {
      result += 10000 + 500 * (this.performance.audience - 20);
    }
    result += 300 * this.performance.audience;

    return result;
  }

  public get volumeCredits(): number {
    return super.volumeCredits + Math.floor(this.performance.audience / 5);
  }
}
```

앞서 함수를 추출했을 때처럼, 이번에도 구조를 보강하면서 코드가 늘어났다. 이번 수정으로 나아진 점은 연극 장르별 계산 코드들을 함께 묶어뒀다는 것입니다.

이번 예를 보면서 서브 클래스를 언제 사용하면 좋을지 감을 잡을 수 있었습니다. 또한 JavaScript 클래스 시스템에서 getter 메서드가 일반적인 데이터 접근 코드와 모양이 같습니다는 점도 꽤나 매력스럽게 느껴집니다.

## 1.10 마치며

[이번 장에서는 크게 3단계로 리팩토링을 진행했습니다.]
1. 원본 함수를 중첩 함수 여러 개로 나누기
2. 단계 쪼개기를 적용해 계산 코드와 출력코드 분리
3. 계산 로직을 다형성으로 표현하기

간단한 예시였지만 이번 예시를 통해 리팩터링이 무엇인지에 대한 감을 잡을 수 있었습니다. 함수 추출하기, 변수 인라인하기, 함수 옮기기, 조건부 로직 다형성으로 바꾸기 등의 다양한 리팩토링 기법을 사용해보았습니다.

> 좋은 코드를 가늠하는 확실한 방법은 '얼마나 수정하기 쉬운가'다.

위 말을 몸소 보여주듯 책 곳곳에서 코드를 개선하는 법을 잘 느낄 수 있게 해준 것 같습니다.