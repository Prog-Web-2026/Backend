import { Request, Response, NextFunction, Router } from "express";
import { PaymentService } from "../services/PaymentService";
import { UserRole } from "../models/UserModel";
import {
  authenticate,
  adminMiddleware,
  customerMiddleware,
} from "../middlewares/AuthMiddleware";

const paymentService = new PaymentService();
const router = Router();

export class PaymentController {
  async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = Number(req.params.id);
      const userId = req.user!.id;
      const currentUserRole = req.user!.role;

      const payment = await paymentService.getPaymentById(
        paymentId,
        userId,
        currentUserRole,
      );

      res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentByOrderId(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = Number(req.params.orderId);
      const userId = req.user!.id;
      const currentUserRole = req.user!.role;

      const payment = await paymentService.getPaymentByOrderId(
        orderId,
        userId,
        currentUserRole,
      );

      res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  }

  async getUserPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const currentUserRole = req.user!.role;

      const payments = await paymentService.getUserPayments(
        userId,
        currentUserRole,
      );

      res.status(200).json(payments);
    } catch (error) {
      next(error);
    }
  }

  async refundPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = Number(req.params.id);
      const currentUserRole = req.user!.role;
      const { reason } = req.body;

      const payment = await paymentService.refundPayment(
        paymentId,
        currentUserRole,
        reason,
      );

      res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  }

  async cancelPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = Number(req.params.id);
      const userId = req.user!.id;
      const currentUserRole = req.user!.role;

      const payment = await paymentService.cancelPayment(
        paymentId,
        userId,
        currentUserRole,
      );

      res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  }
}

const controller = new PaymentController();

// Rotas
router.get(
  "/user",
  authenticate,
  customerMiddleware,
  controller.getUserPayments.bind(controller),
);
router.get(
  "/order/:orderId",
  authenticate,
  controller.getPaymentByOrderId.bind(controller),
);
router.get("/:id", authenticate, controller.getPaymentById.bind(controller));
router.delete(
  "/:id/cancel",
  authenticate,
  controller.cancelPayment.bind(controller),
);

router.post(
  "/:id/refund",
  authenticate,
  adminMiddleware,
  controller.refundPayment.bind(controller),
);

export { router as PaymentRouter };
