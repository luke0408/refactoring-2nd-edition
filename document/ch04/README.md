# 테스트 구축하기

리팩토링은 분명 필요한 일이지만 리팩토링을 제대로 하기 위해서는 테스트 케이스가 필요합니다. 테스트 케이스는 리팩토링 후에도 기능이 제대로 동작하는지 검증하는 안전장치 역할을 합니다.

> [!IMPORTANT]
> 테스트 코드 작성이 개발 시간을 늘리는 것처럼 보일 수 있지만, 실제로는 개발 효율을 크게 높여줍니다.

## 4.1 자가 테스트 코드의 가치

프로그래머들이 실제 코드를 작성하는 시간의 비중은 생각보다 높지 않습니다. 대부분의 시간은 다음과 같은 활동에 사용됩니다:

- 현재 상황 파악
- 설계 작업
- 버그 찾기와 디버깅

> [!NOTE]
> 테스트 코드는 디버깅 시간을 획기적으로 줄여줍니다. 코드 작성 직후 테스트를 실행하면 문제가 있는 코드를 즉시 찾아낼 수 있기 때문입니다.

> [!TIP]
> 테스트를 작성하기 가장 좋은 시점은 프로그래밍을 시작하기 전, 즉 기능을 추가하기 전입니다. 이를 통해 인터페이스 설계에 집중할 수 있고 명확한 완료 시점(모든 테스트 통과)을 정할 수 있습니다.

켄트 백은 이러한 "테스트 우선" 접근법을 발전시켜 테스트 주도 개발(TDD)을 만들었습니다. TDD의 핵심 사이클은 다음과 같습니다:

1. 테스트 작성
2. 테스트 통과를 위한 코드 작성
3. 리팩토링

## 4.2 테스트 할 샘플 코드

## 4.2 테스트할 샘플 코드

이번에는 실제 온라인 쇼핑몰에서 자주 마주치는 상황을 바탕으로 테스트를 진행해보겠습니다. 판매자와 구매자 간의 상품 거래를 중심으로 코드를 작성하고 테스트해볼 것입니다.

> [!NOTE]
> 실제 온라인 쇼핑몰의 복잡한 기능들을 단순화하여, 테스트의 핵심을 이해하기 쉽게 구성했습니다.

### 도메인 설계

먼저 우리가 다룰 핵심 도메인 객체들을 살펴보겠습니다:

> [Actor.ts](../../src/ch04/Actor.ts)

```ts
class Buyer {
    private _nickname: string;
    private _balance: number;
    private _purchasedProducts: Product[];

    constructor(nickname: string, balance: number) {
        this._nickname = nickname;
        this._balance = balance;
        this._purchasedProducts = [];
    }

    get nickname(): string {
        return this._nickname;
    }

    get balance(): number {
        return this._balance;
    }

    get products(): Product[] {
        return this._purchasedProducts;
    }
    
    // ... 메서드들
}

class Seller {
    private _nickname: string;
    private _balance: number;
    private _soldProducts: Product[];

    constructor(nickname: string, balance: number) {
        this._nickname = nickname;
        this._balance = balance;
        this._soldProducts = [];
    }
    
    get nickname(): string {
        return this._nickname;
    }

    get balance(): number {
        return this._balance;
    }

    get products(): Product[] {
        return this._soldProducts;
    }

    // ... 메서드들
}
```

> [Product.ts](../../src/ch04/Product.ts)

```ts
class Product {
    private _name: string;
    private _price: number;
    private _quantity: number;
    private _sellerNickname: string;

    constructor(
        name: string, 
        price: number, 
        quantity: number, 
        sellerNickname: string
    ) { 
        this._name = name;
        this._price = price;
        this._quantity = quantity;
        this._sellerNickname = sellerNickname;
    }

    get name(): string {
        return this._name;
    }

    get price(): number {
        return this._price;
    }

    get quantity(): number {
        return this._quantity;
    }

    get sellerNickname(): string {
        return this._sellerNickname;
    }
    
    // ... 메서드들
}
```

> [!TIP]
> 실제 테스트를 작성할 때는 각 도메인 객체의 상태 변화를 중점적으로 확인해야 합니다.

### 핵심 비즈니스 규칙

우리가 테스트해야 할 주요 비즈니스 규칙들은 다음과 같습니다:

1. 구매자 관련:
   - 구매 시 잔고가 충분한지 확인
   - 구매 후 상품이 구매 목록에 정상적으로 추가되는지 확인
   - 구매 후 잔고가 정확히 차감되는지 확인

2. 판매자 관련:
   - 상품 등록 시 필수 정보가 모두 입력되었는지 확인
   - 판매 후 판매 금액이 정확히 입금되는지 확인
   - 재고 수량이 정확히 관리되는지 확인

## 4.3 첫 번째 테스트

이제 우리의 온라인 쇼핑몰 시스템에 대한 첫 테스트를 작성해보겠습니다. 가장 기본적인 시나리오부터 시작하는 것이 좋습니다.

> [!TIP]
> 개인적으로 given-when-then 구조로 테스트를 작성하는 걸 좋아합니다:
> - given: 테스트에 필요한 객체와 데이터 설정
> - when: 실제 코드 수행
> - then: 결과 검증

## 4.3 첫 번째 테스트

이제 우리의 온라인 쇼핑몰 시스템에 대한 첫 테스트를 작성해보겠습니다. 가장 기본적인 시나리오부터 시작하는 것이 좋습니다.

> [!TIP]
> 테스트를 시작할 때는 가장 단순하면서도 핵심적인 기능부터 시작하세요. 복잡한 시나리오는 기본 기능이 잘 동작하는 것을 확인한 후에 추가하면 됩니다.

먼저 구매자와 판매자 생성을 테스트해보겠습니다:

> [buyer.spec.ts](../../test/ch04/buyer.spec.ts)

```typescript
describe('Buyer', () => {
  it('생성 시 구매자의 정보는 올바르게 설정되어야 한다.', () => {
    //given
    const nickname = 'buyer123';
    const balance = 2000000;

    // when
    const buyer = new Buyer(nickname, balance);

    // then
    expect(buyer.nickname).toBe(nickname);
    expect(buyer.balance).toBe(balance);
    expect(buyer.products).toHaveLength(0);
  });
});
```

> [!IMPORTANT]
> 각 테스트는 한 가지 동작만을 검증하도록 작성하는 것이 좋습니다. 이는 테스트가 실패했을 때 문제를 더 쉽게 파악할 수 있게 해줍니다.

판매자에 대한 테스트:

> [seller.spec.ts](../../test/ch04/seller.spec.ts)

```typescript
describe('Seller', () => {
  it('생성 시 판매자의 정보는 올바르게 설정되어야 한다.', () => {
    // given
    const nickname = 'seller123';
    const balance = 0;

    // when
    const seller = new Seller('seller123', 0);

    // then
    expect(seller.nickname).toBe(nickname);
    expect(seller.balance).toBe(balance);
    expect(seller.products).toHaveLength(0);
  });
});
```

이번엔 상품 생성이 제대로 이루어지는지 테스트해보겠습니다:

> [shopping.spec.ts](../../test/ch04/shopping.spec.ts)

```typescript
describe('Shopping', () => {
  let seller: Seller;

  beforeEach(() => {
    seller = new Seller('seller123', 500000);
  });

  describe('Product', () => {
    it('생성 시 상품의 정보는 올바르게 설정되어야 한다.', () => {
      // given
      const name = '노트북';
      const price = 1000000;
      const quantity = 5;
      const sellerNickname = seller.nickname;

      // when
      const product = new Product(name, price, quantity, sellerNickname);

      // then
      expect(product.name).toBe(name);
      expect(product.price).toBe(price);
      expect(product.quantity).toBe(quantity);
      expect(product.sellerNickname).toBe(seller.nickname);
    });
  });
});
```

> [!NOTE]
> `beforeEach`를 사용하여 각 테스트 케이스마다 새로운 상품 객체를 생성합니다. 이렇게 하면 테스트 간의 독립성을 보장할 수 있습니다.

이러한 기본적인 테스트들이 준비되었다면, 이제 더 복잡한 상호작용을 테스트할 준비가 되었습니다. 다음 섹션에서는 구매와 판매 프로세스에 대한 더 자세한 테스트를 작성해보겠습니다.

## 4.4 테스트 추가하기

> [!IMPORTANT]
> 모든 public 메소드를 테스트하는 것이 아니라, 위험요인을 기준으로 테스트를 작성해야 합니다. 테스트의 주요 목적은 향후 발생할 수 있는 버그를 찾는 것입니다.

## 4.5 픽스처 수정하기

> [!WARNING]
> 테스트에서 객체를 공유하도록 설정하면 테스트 간 독립성이 깨질 수 있습니다. 각 테스트는 독립적으로 실행될 수 있어야 합니다.

[픽스처 관련 내용...]

## 4.6 경계 조건 검사하기

> [!TIP]
> 정상적인 데이터만이 아닌, 다음과 같은 경계 조건도 반드시 테스트해야 합니다:
> - 컬렉션이 비어있는 경우
> - 유효하지 않은 입력값
> - 최대/최소값 경계

[경계 조건 테스트 예시...]

## 4.7 끝나지 않은 여정

> [!NOTE]
> 테스트는 지속적으로 발전하는 과정입니다. 완벽한 테스트 케이스를 처음부터 만들 수는 없으며, 버그가 발견될 때마다 관련 테스트를 추가하며 개선해나가야 합니다.