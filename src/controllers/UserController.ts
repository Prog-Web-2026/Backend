import { Request, Response } from "express";
import { UserRepository } from "../repository/UserRepository";

const userRepo = new UserRepository();

export class UserController {
  async create(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const user = await userRepo.createUser(name, email, password);
      res.status(201).json(user);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar usuário", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const users = await userRepo.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter usuários", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = await userRepo.getUserById(Number(req.params.id));
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
      const user = await userRepo.updateUser(Number(req.params.id), req.body);
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
      const user = await userRepo.deleteUser(Number(req.params.id));
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
