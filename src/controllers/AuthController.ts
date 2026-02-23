import { Request, Response, NextFunction, Router } from "express";
import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";
import { UserRole } from "../models/UserModel";
import { ValidationError, UnauthorizedError } from "../config/ErrorHandler";
import { AuthValidator } from "../validators/AuthValidator";

const authService = new AuthService();
const userService = new UserService();

const publicRouter = Router();
const protectedRouter = Router();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      AuthValidator.register(req.body);

      const {
        name,
        email,
        password,
        role = UserRole.CUSTOMER,
        address,
        phone,
      } = req.body;

      const result = await userService.register({
        name,
        email,
        password,
        role,
        address,
        phone,
      });

      return res.status(201).json({
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          address: result.user.address,
          phone: result.user.phone,
          isActive: result.user.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      AuthValidator.login(req.body);

      const { email, password } = req.body;

      const result = await userService.login(email, password);

      return res.status(200).json({
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req: Request, res: Response, _next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          message: "Token não fornecido",
        });
      }

      const payload = authService.verifyToken(token);

      return res.status(200).json({
        valid: true,
        payload: {
          id: payload!.id,
          email: payload!.email,
          role: payload!.role,
        },
      });
    } catch (error) {
      return res.status(401).json({
        valid: false,
        message: "Token inválido ou expirado",
      });
    }
  }

  async registerDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      AuthValidator.register(req.body);

      const { name, email, password, address, phone } = req.body;

      const result = await userService.register({
        name,
        email,
        password,
        role: UserRole.DELIVERY,
        address,
        phone,
      });

      return res.status(201).json({
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          address: result.user.address,
          phone: result.user.phone,
          isActive: result.user.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async loginDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      AuthValidator.login(req.body);

      const { email, password } = req.body;

      const result = await userService.login(email, password);

      if (result.user.role !== UserRole.DELIVERY) {
        throw new UnauthorizedError(
          "Apenas entregadores podem fazer login aqui",
        );
      }

      return res.status(200).json({
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      AuthValidator.changePassword(req.body);

      const userId = req.user?.id as number;
      const { currentPassword, newPassword } = req.body;

      await userService.changePassword(userId, currentPassword, newPassword);

      return res.status(200).json({
        message: "Senha alterada com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as number;
      const currentUserRole = req.user?.role as UserRole;

      const user = await userService.getUserById(
        userId,
        userId,
        currentUserRole,
      );

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({
        message: "Logout realizado com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  async checkAuth(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({
        authenticated: true,
        user: {
          id: req.user!.id,
          email: req.user!.email,
          role: req.user!.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async checkRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.role as UserRole;

      return res.status(200).json({
        isAdmin: authService.isAdmin(userRole),
        isDelivery: authService.isDelivery(userRole),
        isCustomer: authService.isCustomer(userRole),
        role: userRole,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new ValidationError("Token não fornecido");
      }

      const payload = authService.verifyToken(token);

      const newToken = authService.generateToken({
        id: payload!.id,
        email: payload!.email,
        role: payload!.role,
      });

      return res.status(200).json({
        token: newToken,
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          message: "Token expirado, faça login novamente",
        });
      }
      next(error);
    }
  }
}

const controller = new AuthController();

publicRouter.post("/register", controller.register.bind(controller));
publicRouter.post("/login", controller.login.bind(controller));
publicRouter.post("/verify", controller.verifyToken.bind(controller));
publicRouter.post(
  "/delivery/register",
  controller.registerDelivery.bind(controller),
);
publicRouter.post("/delivery/login", controller.loginDelivery.bind(controller));

protectedRouter.post("/logout", controller.logout.bind(controller));
protectedRouter.get("/me", controller.getCurrentUser.bind(controller));
protectedRouter.post(
  "/change-password",
  controller.changePassword.bind(controller),
);
protectedRouter.get("/check", controller.checkAuth.bind(controller));
protectedRouter.get("/role", controller.checkRole.bind(controller));
protectedRouter.post("/refresh", controller.refreshToken.bind(controller));

export { publicRouter as AuthPublicRouter };
export { protectedRouter as AuthProtectedRouter };

const combinedRouter = Router();
combinedRouter.use(publicRouter);
combinedRouter.use(protectedRouter);
export { combinedRouter as AuthRouter };
