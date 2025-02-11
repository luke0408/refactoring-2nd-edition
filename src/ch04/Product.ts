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

  // ... 메서드들
}
