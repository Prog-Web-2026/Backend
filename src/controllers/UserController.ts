import { Request, Response } from "express";
import { UserService } from "../services/UserService";

const userService = new UserService();

export class UserController {
  async create(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const user = await userService.create({ name, email, password });
      res.status(201).json(user);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar usuário", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.getAll();
      res.json(users);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter usuários", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = await userService.getById(Number(req.params.id));
      if (!user)
        return res.status(404).json({ message: "Usuário não encontrado" });
      res.json(user);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar usuário", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = await userService.update(Number(req.params.id), req.body);
      if (!user)
        return res.status(404).json({ message: "Usuário não encontrado" });
      res.json(user);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar usuário", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = await userService.delete(Number(req.params.id));
      if (!user)
        return res.status(404).json({ message: "Usuário não encontrado" });
      res.json({ message: "Usuário deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar usuário", error: error.message });
    }
  }
}
