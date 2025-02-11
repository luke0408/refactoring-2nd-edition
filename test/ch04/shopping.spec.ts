import { Seller } from '../../src/ch04/Actor';
import { Product } from '../../src/ch04/Product';

describe('Shopping', () => {
  let seller: Seller;

  beforeEach(() => {
    seller = new Seller('seller123', 500000);
  });

  describe('Product', () => {
    describe('생성 시 상품의 정보는 올바르게 설정되어야 한다.', () => {
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
