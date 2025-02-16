import { Buyer, Seller } from './Actor';
import { Product } from './Product';

export class ShoppingService {
  registerProduct(seller: Seller, product: Product): boolean {
    if (product.price <= 0 || product.quantity <= 0) {
      return false;
    }
    seller.registerProduct(product.name, product.price, product.quantity);
    return true;
  }

  purchaseProduct(buyer: Buyer, seller: Seller, productName: string, quantity: number): boolean {
    const product = seller.findProduct(productName);

    if (product === undefined) return false;

    const totalPrice = product.price * quantity;
    if (buyer.balance < totalPrice) return false;
    if (product.quantity < quantity) return false;

    buyer.purchase(product, quantity, totalPrice);
    seller.sellProduct(product, quantity, totalPrice);

    return true;
  }
}
