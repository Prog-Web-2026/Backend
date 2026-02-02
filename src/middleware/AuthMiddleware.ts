import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { AuthPayload } from "../services/AuthService";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export class AuthMiddleware {
  private authService = new AuthService();

  // Middleware para validar token
  authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res
          .status(401)
          .json({ message: "Token não fornecido" });
      }

      const token = authHeader.split(" ")[1]; // Bearer <token>

      if (!token) {
        return res
          .status(401)
          .json({ message: "Formato de token inválido" });
      }

      const payload = this.authService.verifyToken(token);

      if (!payload) {
        return res
          .status(401)
          .json({ message: "Token inválido ou expirado" });
      }

      req.user = payload;
      next();
    } catch (error: any) {
      return res
        .status(401)
        .json({ message: "Erro ao validar token", error: error.message });
    }
  };

  // Middleware para validação de dados
  validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const errorMessages = error.details.map((detail: any) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));
        return res.status(400).json({ errors: errorMessages });
      }

      req.body = value;
      next();
    };
  };
}

export const authMiddleware = new AuthMiddleware();
