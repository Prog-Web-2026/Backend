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

      res.status(200).json({
        order,
      });
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

      res.status(200).json({
        orders,
      });
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

      res.status(200).json({
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async respondToDeliveryAssignment(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const assignmentId = Number(req.params.assignmentId);
      const deliveryId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;
      const { accept } = req.body;

      const result = await orderService.respondToDeliveryAssignment(
        assignmentId,
        deliveryId,
        accept,
        currentUserRole,
      );

      res.status(200).json({
        message: `Atribuição ${accept ? "aceita" : "rejeitada"}`,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingDeliveryAssignments(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const deliveryId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;

      const assignments = await orderService.getPendingDeliveryAssignments(
        deliveryId,
        currentUserRole,
      );

      res.status(200).json({
        assignments,
      });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new OrderController();

router.post(
  "/",
  customerMiddleware,
  controller.createOrderFromSelectedItems.bind(controller),
);

router.get("/:id", controller.getOrderById.bind(controller));

router.get("/", customerMiddleware, controller.getUserOrders.bind(controller));

router.patch(
  "/:id/status",
  adminMiddleware,
  controller.updateOrderStatus.bind(controller),
);

router.patch(
  "/:id/cancel",
  customerMiddleware,
  controller.cancelOrder.bind(controller),
);

router.post(
  "/:id/payment",
  customerMiddleware,
  controller.processOrderPayment.bind(controller),
);

router.get(
  "/stats",
  adminMiddleware,
  controller.getOrderStatistics.bind(controller),
);

router.patch(
  "/delivery/:assignmentId/respond",
  deliveryMiddleware,
  controller.respondToDeliveryAssignment.bind(controller),
);

router.get(
  "/delivery/pending",
  deliveryMiddleware,
  controller.getPendingDeliveryAssignments.bind(controller),
);

export { router as OrderRouter };
