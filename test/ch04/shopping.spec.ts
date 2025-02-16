import { Seller, Buyer } from '../../src/ch04/Actor';
import { Product } from '../../src/ch04/Product';
import { ShoppingService } from '../../src/ch04/Shopping.service';

describe('ShoppingService', () => {
  let shoppingService: ShoppingService;
  let seller: Seller;
  let buyer: Buyer;

  beforeEach(() => {
    shoppingService = new ShoppingService();
    seller = new Seller('TestSeller', 1000);
  });

  describe('상품 등록 시', () => {
    it('상품이 유효하면 성공한다.', () => {
      const product = new Product('Valid Product', 10, 5, seller.nickname);
      expect(shoppingService.registerProduct(seller, product)).toBe(true);
    });

    it('상품의 가격이 0이면 실패한다.', () => {
      const product = new Product('Zero Price Product', 0, 5, seller.nickname);
      expect(shoppingService.registerProduct(seller, product)).toBe(false);
    });

    it('상품의 가격이 음수면 실패한다.', () => {
      const product = new Product('Negative Price Product', -10, 5, seller.nickname);
      expect(shoppingService.registerProduct(seller, product)).toBe(false);
    });

    it('상품의 수량이 0이면 실패한다.', () => {
      const product = new Product('Zero Quantity Product', 10, 0, seller.nickname);
      expect(shoppingService.registerProduct(seller, product)).toBe(false);
    });

    it('상품의 수량이 음수면 실패한다.', () => {
      const product = new Product('Negative Quantity Product', 10, -5, seller.nickname);
      expect(shoppingService.registerProduct(seller, product)).toBe(false);
    });
  });

  describe('상품 구매 시', () => {
    let product: Product;

    beforeEach(() => {
      // 판매자가 상품을 등록한다.
      product = new Product('Valid Product', 10, 5, seller.nickname);
      shoppingService.registerProduct(seller, product);
    });

    describe('결과가 성공이라면,', () => {
      let quantity: number;
      let totalPrice: number;

      beforeEach(() => {
        buyer = new Buyer('TestBuyer', 1000);
        quantity = 2;
        totalPrice = product.price * quantity;
        shoppingService.purchaseProduct(buyer, seller, product.name, quantity);
      });

      it('구매자의 상품 리스트에 상품이 추가된다.', () => {
        expect(buyer.products.length).toBe(1);
        expect(buyer.products[0].name).toBe(product.name);
      });

      it('구매자의 잔액에서 총 가격만큼 차감된다.', () => {
        expect(buyer.balance).toBe(1000 - totalPrice);
      });

      it('판매자의 잔액이 총 가격만큼 증가된다.', () => {
        expect(seller.balance).toBe(1000 + totalPrice);
      });

      it('판매자의 상품 수량이 차감된다.', () => {
        expect(seller.findProduct(product.name)?.quantity).toBe(5 - quantity);
      });
    });

    describe('결과가 실패라면,', () => {
      it('구매자의 잔액이 부족하면 구매에 실패한다.', () => {
        buyer = new Buyer('TestBuyer', 10);
        const quantity = 2; // totalPrice = 20 > buyer.balance
        const result = shoppingService.purchaseProduct(buyer, seller, product.name, quantity);
        expect(result).toBe(false);
      });

      it('판매자의 상품 수량이 부족하면 구매에 실패한다.', () => {
        const quantity = 10; // product.quantity는 5이므로 부족
        const result = shoppingService.purchaseProduct(buyer, seller, product.name, quantity);
        expect(result).toBe(false);
      });

      it('판매자가 해당 상품을 가지고 있지 않으면 구매에 실패한다.', () => {
        const result = shoppingService.purchaseProduct(buyer, seller, 'NonExistent Product', 1);
        expect(result).toBe(false);
      });
    });
  });
});
