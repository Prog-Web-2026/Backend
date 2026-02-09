import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthService } from "../services/AuthService";
import { UserRole } from "../models/UserModel";

export interface AuthPayload {
  id: number;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user: AuthPayload;
    }
  }
}

export class AuthMiddleware {
  private authService = new AuthService();

  authenticate: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Token não fornecido",
        });
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Formato de token inválido. Use: Bearer <token>",
        });
      }

      const payload = this.authService.verifyToken(token);

      if (!payload) {
        return res.status(401).json({
          success: false,
          message: "Token inválido ou expirado",
        });
      }

      req.user = payload;
      next();
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: "Erro ao validar token",
        error: error.message,
      });
    }
  };

  requireAdmin: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message:
          "Acesso negado. Apenas administradores podem acessar esta rota.",
      });
    }

    next();
  };

  requireCustomer: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    if (req.user.role !== UserRole.CUSTOMER) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas clientes podem acessar esta rota.",
      });
    }

    next();
  };

  requireDelivery: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    if (req.user.role !== UserRole.DELIVERY) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas entregadores podem acessar esta rota.",
      });
    }

    next();
  };
}

export const authMiddleware = new AuthMiddleware();

export const authenticate: RequestHandler = authMiddleware.authenticate;
export const adminMiddleware: RequestHandler = authMiddleware.requireAdmin;
export const customerMiddleware: RequestHandler =
  authMiddleware.requireCustomer;
export const deliveryMiddleware: RequestHandler =
  authMiddleware.requireDelivery;
