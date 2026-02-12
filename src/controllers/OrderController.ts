import { Request, Response, NextFunction, Router } from "express";
import { OrderService } from "../services/OrderService";
import { UserRole } from "../models/UserModel";
import {
  adminMiddleware,
  customerMiddleware,
  deliveryMiddleware,
} from "../middlewares/AuthMiddleware";

const orderService = new OrderService();
const router = Router();

export class OrderController {
  async createOrderFromSelectedItems(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;
      const { selectedCartItemIds, notes } = req.body;

      if (!selectedCartItemIds || !Array.isArray(selectedCartItemIds)) {
        return res.status(400).json({
          message: "IDs dos itens do carrinho são obrigatórios",
        });
      }

      const result = await orderService.createOrderFromSelectedItems(
        userId,
        selectedCartItemIds,
        notes,
        currentUserRole,
      );

      res.status(201).json({
        message: "Pedido criado com sucesso",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.id);
      const userId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;

      const order = await orderService.getOrderById(
        orderId,
        userId,
        currentUserRole,
      );

      res.status(200).json({ order });
    } catch (error) {
      next(error);
    }
  }

  async getUserOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;
      const { status, limit, offset } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (limit) filters.limit = Number(limit);
      if (offset) filters.offset = Number(offset);

      const orders = await orderService.getUserOrders(
        userId,
        currentUserRole,
        filters,
      );

      res.status(200).json({ orders });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.id);
      const userId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;
      const { status } = req.body;

      const order = await orderService.updateOrderStatus(
        orderId,
        status,
        userId,
        currentUserRole,
      );

      res.status(200).json({
        message: "Status do pedido atualizado",
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.id);
      const userId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;

      const order = await orderService.cancelOrder(
        orderId,
        userId,
        currentUserRole,
      );

      res.status(200).json({
        message: "Pedido cancelado com sucesso",
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  async processOrderPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.id);
      const userId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;
      const paymentData = req.body;

      const result = await orderService.processOrderPayment(
        orderId,
        userId,
        paymentData,
        currentUserRole,
      );

      res.status(200).json({
        message: "Pagamento processado com sucesso",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;

      const stats = await orderService.getOrderStatistics(
        userId,
        currentUserRole,
      );

      res.status(200).json({ stats });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableOrdersForDelivery(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const currentUserRole = req.user?.role as UserRole;

      const orders =
        await orderService.getAvailableOrdersForDelivery(currentUserRole);

      res.status(200).json({ orders });
    } catch (error) {
      next(error);
    }
  }

  async acceptOrderForDelivery(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const orderId = Number(req.params.id);
      const deliveryId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;

      const order = await orderService.acceptOrderForDelivery(
        orderId,
        deliveryId,
        currentUserRole,
      );

      res.status(200).json({
        message: "Pedido aceito para entrega",
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  async markOrderAsDelivered(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.id);
      const userId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;

      const order = await orderService.updateOrderStatus(
        orderId,
        "delivered" as any,
        userId,
        currentUserRole,
      );

      res.status(200).json({
        message: "Pedido marcado como entregue",
        order,
      });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new OrderController();

// Rotas de cliente
router.post(
  "/",
  customerMiddleware,
  controller.createOrderFromSelectedItems.bind(controller),
);

router.get("/my-orders", controller.getUserOrders.bind(controller));

router.post(
  "/:id/payment",
  customerMiddleware,
  controller.processOrderPayment.bind(controller),
);

router.patch(
  "/:id/cancel",
  customerMiddleware,
  controller.cancelOrder.bind(controller),
);

// Rotas de entregador
router.get(
  "/delivery/available",
  deliveryMiddleware,
  controller.getAvailableOrdersForDelivery.bind(controller),
);

router.post(
  "/delivery/:id/accept",
  deliveryMiddleware,
  controller.acceptOrderForDelivery.bind(controller),
);

router.patch(
  "/delivery/:id/delivered",
  deliveryMiddleware,
  controller.markOrderAsDelivered.bind(controller),
);

router.get(
  "/delivery/my-deliveries",
  deliveryMiddleware,
  controller.getUserOrders.bind(controller),
);

// Rotas de admin
router.get(
  "/stats",
  adminMiddleware,
  controller.getOrderStatistics.bind(controller),
);

router.patch(
  "/:id/status",
  adminMiddleware,
  controller.updateOrderStatus.bind(controller),
);

router.get("/all", adminMiddleware, controller.getUserOrders.bind(controller));

// Rota comum
router.get("/:id", controller.getOrderById.bind(controller));

export { router as OrderRouter };
