import { Request, Response, NextFunction, Router } from "express";
import { CartService } from "../services/CartService";
import { authenticate } from "../middlewares/AuthMiddleware";
import { CartValidator } from "../validators/CartValidator";

const cartService = new CartService();
const router = Router();

export class CartController {
  async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      CartValidator.addToCart(req.body);

      const userId = req.user!.id;
      const { productId, quantity } = req.body;

      const cartItem = await cartService.addToCart(
        userId,
        productId,
        quantity || 1,
      );

      res.status(201).json({
        message: "Item adicionado ao carrinho",
        cartItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkoutSelectedItems(req: Request, res: Response, next: NextFunction) {
    try {
      CartValidator.checkout(req.body);

      const userId = req.user!.id;
      const { selectedCartItemIds } = req.body;

      const result = await cartService.checkoutSelectedItems(
        userId,
        selectedCartItemIds,
      );

      res.status(200).json({
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      CartValidator.updateCartItem(req.body);

      const userId = req.user!.id;
      const itemId = Number(req.params.itemId);
      const { quantity } = req.body;

      const cartItem = await cartService.updateCartItem(
        userId,
        itemId,
        quantity,
      );

      res.status(200).json({
        message: "Item do carrinho atualizado",
        cartItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cart = await cartService.getUserCart(userId);

      res.status(200).json({ cart });
    } catch (error) {
      next(error);
    }
  }

  async removeFromCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const itemId = Number(req.params.itemId);

      await cartService.removeFromCart(userId, itemId);

      res.status(200).json({ message: "Item removido do carrinho" });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      await cartService.clearCart(userId);

      res.status(200).json({ message: "Carrinho esvaziado" });
    } catch (error) {
      next(error);
    }
  }

  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const availability = await cartService.checkCartAvailability(userId);

      res.status(200).json({ availability });
    } catch (error) {
      next(error);
    }
  }

  async calculateTotal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const total = await cartService.calculateCartTotal(userId);

      res.status(200).json({ total });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new CartController();

router.use(authenticate);

router.post("/", controller.addToCart.bind(controller));
router.get("/", controller.getUserCart.bind(controller));
router.post("/checkout", controller.checkoutSelectedItems.bind(controller));
router.put("/:itemId", controller.updateCartItem.bind(controller));
router.delete("/:itemId", controller.removeFromCart.bind(controller));
router.delete("/", controller.clearCart.bind(controller));
router.get("/availability", controller.checkAvailability.bind(controller));
router.get("/total", controller.calculateTotal.bind(controller));

export { router as CartRouter };
