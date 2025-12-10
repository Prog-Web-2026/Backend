import { Request, Response } from "express";
import { ClienteService } from "../services/ClienteService";

const clienteService = new ClienteService();

export class ClienteController {
  async create(req: Request, res: Response) {
    try {
      const cliente = await clienteService.create(req.body);
      res.status(201).json(cliente);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar cliente", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const clientes = await clienteService.getAll();
      res.json(clientes);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter clientes", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const cliente = await clienteService.getById(Number(req.params.id));
      if (!cliente)
        return res.status(404).json({ message: "Cliente não encontrado" });
      res.json(cliente);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar cliente", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const cliente = await clienteService.update(
        Number(req.params.id),
        req.body
      );
      if (!cliente)
        return res.status(404).json({ message: "Cliente não encontrado" });
      res.json(cliente);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar cliente", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const cliente = await clienteService.delete(Number(req.params.id));
      if (!cliente)
        return res.status(404).json({ message: "Cliente não encontrado" });
      res.json({ message: "Cliente deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar cliente", error: error.message });
    }
  }
}
