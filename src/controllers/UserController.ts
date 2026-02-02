import { Request, Response } from "express";
import { UserService } from "../services/UserService";

const userService = new UserService();

export class UserController {
  // Registrar novo usuário
  async create(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const user = await userService.create({ name, email, password });
      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar usuário" });
    }
  }

  // Login - Autenticar usuário
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await userService.login(email, password);
      res.status(200).json({
        message: "Login realizado com sucesso",
        ...result,
      });
    } catch (error: any) {
      res.status(401).json({ message: error.message || "Erro ao fazer login" });
    }
  }

  // Obter todos os usuários
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

  // Obter usuário por ID
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

  // Atualizar usuário
  async update(req: Request, res: Response) {
    try {
      const user = await userService.update(Number(req.params.id), req.body);
      if (!user)
        return res.status(404).json({ message: "Usuário não encontrado" });
      res.json({
        message: "Usuário atualizado com sucesso",
        user,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar usuário", error: error.message });
    }
  }

  // Deletar usuário
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
