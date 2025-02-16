import { Seller } from '../../src/ch04/Actor';

describe('Seller', () => {
  describe('생성 시', () => {
    it('판매자의 정보는 올바르게 설정되어야 한다.', () => {
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

  describe('상품 등록 시', () => {
    it('필수 정보가 모두 입력되어야 한다.', () => {
      // given
      const nickname = 'seller123';
      const balance = 0;
      const name = '노트북';
      const price = 1000000;
      const quantity = 5;

      // when
      const seller = new Seller(nickname, balance);
      seller.registerProduct(name, price, quantity);

      // then
      expect(seller.nickname).toBe(nickname);
      expect(seller.balance).toBe(balance);
    });
  });
});
