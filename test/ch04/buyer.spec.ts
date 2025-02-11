import { Buyer } from '../../src/ch04/Actor';

describe('Buyer', () => {
  describe('생성 시 구매자의 정보는 올바르게 설정되어야 한다.', () => {
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
