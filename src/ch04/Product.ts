export class Product {
    constructor(
        name: string, 
        price: number, 
        quantity: number, 
        sellerNickname: string
    ) { }

    get name(): string {
        return this.name;
    }

    get price(): number {
        return this.price;
    }

    get quantity(): number {
        return this.quantity;
    }

    get sellerNickname(): string {
        return this.sellerNickname;
    }
    
    // ... 메서드들
}