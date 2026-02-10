import { CartRepository } from "../repository/CartRepository";
import { ProductRepository } from "../repository/ProductRepository";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../config/ErrorHandler";

export class CartService {
  private cartRepository = new CartRepository();
  private productRepository = new ProductRepository();

  async addToCart(userId: number, productId: number, quantity: number = 1) {
    if (quantity <= 0) {
      throw new ValidationError("Quantidade deve ser maior que zero");
    }

    const product = await this.productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Produto não encontrado");
    }

    if (product.stock < quantity) {
      throw new ConflictError(
        `Estoque insuficiente. Disponível: ${product.stock}`,
      );
    }

    const existingItem = await this.cartRepository.findUserCartItem(
      userId,
      productId,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new ConflictError(
          `Estoque insuficiente para adicionar mais unidades. Disponível: ${product.stock}`,
        );
      }

      const affectedCount = await this.cartRepository.update(existingItem.id, {
        quantity: newQuantity,
      });

      if (affectedCount === 0) {
        throw new AppError("Erro ao atualizar carrinho", 500);
      }

      return await this.cartRepository.findById(existingItem.id, {
        include: [{ association: "product" }],
      });
    } else {
      return await this.cartRepository.create({
        userId,
        productId,
        quantity,
      });
    }
  }

  async getUserCart(userId: number) {
    const cartItems = await this.cartRepository.findByUserId(userId, {
      include: [
        {
          association: "product",
          include: [{ association: "category" }],
        },
      ],
    });

    let subtotal = 0;
    const itemsWithDetails = await Promise.all(
      cartItems.map(async (item) => {
        const product = item.product;
        if (!product) return null;

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
          },
          itemTotal,
        };
      }),
    );

    const validItems = itemsWithDetails.filter((item) => item !== null);

    return {
      items: validItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      itemCount: validItems.length,
    };
  }

  async checkoutSelectedItems(userId: number, selectedCartItemIds: number[]) {
    if (selectedCartItemIds.length === 0) {
      throw new ValidationError("Selecione pelo menos um item para comprar");
    }

    const allCartItems = await this.cartRepository.findByUserId(userId, {
      include: [{ association: "product" }],
    });

    const selectedItems = allCartItems.filter(
      (item) => selectedCartItemIds.includes(item.id) && item.product,
    );

    if (selectedItems.length === 0) {
      throw new ValidationError("Nenhum item válido selecionado");
    }

    const itemsToCheckout = [];
    let subtotal = 0;

    for (const cartItem of selectedItems) {
      const product = cartItem.product!;

      if (!product.isActive || product.stock < cartItem.quantity) {
        throw new ConflictError(
          !product.isActive ? "Produto indisponível" : "Estoque insuficiente",
        );
      }

      const itemTotal = product.price * cartItem.quantity;
      subtotal += itemTotal;

      itemsToCheckout.push({
        cartItemId: cartItem.id,
        productId: product.id,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        itemTotal,
        productName: product.name,
      });
    }

    return {
      items: itemsToCheckout,
      subtotal: parseFloat(subtotal.toFixed(2)),
      itemCount: itemsToCheckout.length,
    };
  }

  async updateCartItem(userId: number, itemId: number, quantity: number) {
    if (quantity <= 0) {
      throw new ValidationError("Quantidade deve ser maior que zero");
    }

    const cartItem = await this.cartRepository.findById(itemId, {
      include: [{ association: "product" }],
    });

    if (!cartItem) {
      throw new NotFoundError("Item não encontrado no carrinho");
    }

    if (cartItem.userId !== userId) {
      throw new ForbiddenError("Acesso negado");
    }

    const product = cartItem.product;
    if (!product) {
      throw new NotFoundError("Produto não encontrado");
    }

    if (product.stock < quantity) {
      throw new ConflictError(
        `Estoque insuficiente. Disponível: ${product.stock}`,
      );
    }

    const affectedCount = await this.cartRepository.update(itemId, {
      quantity,
    });

    if (affectedCount === 0) {
      throw new AppError("Erro ao atualizar item do carrinho", 500);
    }

    return await this.cartRepository.findById(itemId, {
      include: [{ association: "product" }],
    });
  }

  async removeFromCart(userId: number, itemId: number) {
    const cartItem = await this.cartRepository.findById(itemId);

    if (!cartItem) {
      throw new NotFoundError("Item não encontrado no carrinho");
    }

    if (cartItem.userId !== userId) {
      throw new ForbiddenError("Acesso negado");
    }

    const deletedCount = await this.cartRepository.delete(itemId);

    if (deletedCount === 0) {
      throw new AppError("Erro ao remover item do carrinho", 500);
    }

    return true;
  }

  async removeSelectedItemsAfterCheckout(
    userId: number,
    cartItemIds: number[],
  ): Promise<boolean> {
    for (const cartItemId of cartItemIds) {
      const cartItem = await this.cartRepository.findById(cartItemId);
      if (cartItem && cartItem.userId === userId) {
        await this.cartRepository.delete(cartItemId);
      }
    }
    return true;
  }

  async clearCart(userId: number) {
    const deletedCount = await this.cartRepository.clearUserCart(userId);
    return deletedCount > 0;
  }

  async checkCartAvailability(userId: number) {
    const cartItems = await this.cartRepository.findByUserId(userId, {
      include: [{ association: "product" }],
    });

    for (const item of cartItems) {
      const product = item.product;

      if (!product) {
        throw new NotFoundError(
          `Produto não encontrado para item ID: ${item.id}`,
        );
      }

      if (!product.isActive) {
        throw new ConflictError(`Produto "${product.name}" indisponível`);
      }

      if (product.stock < item.quantity) {
        throw new ConflictError(
          `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
        );
      }
    }

    return {
      available: true,
    };
  }

  async calculateCartTotal(userId: number) {
    const cart = await this.getUserCart(userId);
    return {
      subtotal: cart.subtotal,
      itemCount: cart.itemCount,
    };
  }
}
