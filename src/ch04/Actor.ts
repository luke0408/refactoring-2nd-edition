import { Product } from './Product';

export class Buyer {
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

  decreaseBalance(amount: number): void {
    if (this._balance < amount) {
      throw new Error('잔액이 부족합니다.');
    }
    this._balance -= amount;
  }

  increaseBalance(amount: number): void {
    this._balance += amount;
  }

  purchase(product: Product, quantity: number, totalPrice: number): void {
    if (this._balance < totalPrice) {
      throw new Error('잔액이 부족합니다.');
    }
    this.decreaseBalance(totalPrice);

    this._purchasedProducts.push(product.cloneWithQuantity(quantity));
  }
}

export class Seller {
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

  registerProduct(name: string, price: number, quantity: number) {
    const product = new Product(name, price, quantity, this.nickname);
    this._soldProducts.push(product);
  }

  findProduct(productName: string): Product | undefined {
    return this.products.find((product) => product.name === productName);
  }

  decreaseBalance(amount: number): void {
    if (this._balance < amount) {
      throw new Error('잔액이 부족합니다.');
    }
    this._balance -= amount;
  }

  increaseBalance(amount: number): void {
    this._balance += amount;
  }

  sellProduct(product: Product, quantity: number, totalPrice: number): void {
    if (this._nickname !== product.sellerNickname) {
      throw new Error('다른 판매자의 상품입니다.');
    }

    product.decreaseQuantity(quantity);
    this.increaseBalance(totalPrice);

    if (product.quantity === 0) {
      this._soldProducts = this._soldProducts.filter((p) => p.name !== product.name);
    }
  }
}
