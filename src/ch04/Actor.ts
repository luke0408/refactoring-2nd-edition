import { Product } from "./Product";

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
    
    // ... 메서드들
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

    // ... 메서드들
}
