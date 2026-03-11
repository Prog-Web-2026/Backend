import { Request, Response, Router, NextFunction } from "express";
import { UserService } from "../services/UserService";
import { UserRole } from "../models/UserModel";
import {
  adminMiddleware,
  customerMiddleware,
} from "../middlewares/AuthMiddleware";

import { updateUserSchema, updateAddressSchema } from "../validators/UserValidator";
import { validate } from "../validate";

const userService = new UserService();
const router = Router();

export class UserController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.user?.role as UserRole;
      const { role: filterRole, isActive } = req.query;

      const filters: any = {};
      if (filterRole) filters.role = filterRole;
      if (isActive !== undefined) filters.isActive = isActive === "true";

      const users = await userService.getAllUsers(role, filters);
      return res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const currentUserId = req.user?.id as number;
      const role = req.user?.role as UserRole;

      const user = await userService.getUserById(id, currentUserId, role);
      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      validate(updateUserSchema, req.body);

      const user = await userService.updateUser(
        Number(req.params.id),
        req.body,
        req.user.id,
        req.user.role
      );

      return res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  async updateUserAddress(req: Request, res: Response, next: NextFunction) {
    try {
      validate(updateAddressSchema, req.body);

      const user = await userService.updateUserAddress(
        req.user.id,
        req.body,
        req.user.role
      );

      return res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const currentUserId = req.user?.id as number;
      const role = req.user?.role as UserRole;

      await userService.deleteUser(id, currentUserId, role);
      return res.status(200).json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      next(error);
    }
  }

  async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const role = req.user?.role as UserRole;
      const { isActive } = req.body;

      const user = await userService.toggleUserStatus(id, role, isActive);
      return res.status(200).json({
        message: `Usuário ${isActive ? "ativado" : "desativado"} com sucesso`,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id as number;

      if (!req.body.currentPassword || !req.body.newPassword) {
        return res.status(400).json({
          details: {
            currentPassword: "INVALID_IS_EMPTY",
            newPassword: "INVALID_IS_EMPTY",
          },
        });
      }

      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(userId, currentPassword, newPassword);
      return res.status(200).json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new UserController();

router.get("/", adminMiddleware, controller.getAllUsers.bind(controller));

// /me routes MUST come before /:id to avoid "me" being captured as an id
router.put("/me/address", controller.updateUserAddress.bind(controller));
router.put("/me/password", controller.changePassword.bind(controller));

router.get("/:id", controller.getUserById.bind(controller));
router.put("/:id", controller.updateUser.bind(controller));
router.delete("/:id", controller.deleteUser.bind(controller));
router.patch(
  "/:id/status",
  adminMiddleware,
  controller.toggleUserStatus.bind(controller)
);

export { router as UserRouter };
