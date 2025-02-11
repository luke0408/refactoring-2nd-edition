import { Product } from "./Product";

export class Buyer {
    private purchasedProducts: Product[];

    constructor(nickname: string, balance: number) {
        this.purchasedProducts = [];
    }

    get nickname(): string {
        return this.nickname;
    }

    get balance(): number {
        return this.balance;
    }

    get products(): Product[] {
        return this.purchasedProducts;
    }
    
    // ... 메서드들
}

export class Seller {
    private soldProducts: Product[];

    constructor(nickname: string, balance: number) {
        this.soldProducts = [];
    }
    
    get nickname(): string {
        return this.nickname;
    }

    get balance(): number {
        return this.balance;
    }

    get products(): Product[] {
        return this.soldProducts;
    }

    // ... 메서드들
}

