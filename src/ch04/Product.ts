export class Product {
  private _name: string;
  private _price: number;
  private _quantity: number;
  private _sellerNickname: string;

  constructor(name: string, price: number, quantity: number, sellerNickname: string) {
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

  increasePrice(price: number): void {
    this._price += price;
  }

  decreasePrice(price: number): void {
    if (this._price < price) {
      throw new Error('가격은 음수일 수 없습니다.');
    }
    this._price -= price;
  }

  increaseQuantity(quantity: number): void {
    this._quantity += quantity;
  }

  decreaseQuantity(quantity: number): void {
    if (this._quantity < quantity) {
      throw new Error('수량은 음수일 수 없습니다.');
    }
    this._quantity -= quantity;
  }

  cloneWithQuantity(quantity: number): Product {
    return new Product(this._name, this._price, quantity, this._sellerNickname);
  }
}
