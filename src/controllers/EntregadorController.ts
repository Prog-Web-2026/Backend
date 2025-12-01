import { Request, Response } from "express";
import { EntregadorRepository } from "../repository/EntregadorRepository";

const entregadorRepo = new EntregadorRepository();

export class EntregadorController {
  async create(req: Request, res: Response) {
    try {
      const entregador = await entregadorRepo.createEntregador(req.body);
      res.status(201).json(entregador);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar entregador", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const entregadores = await entregadorRepo.getAllEntregadores();
      res.json(entregadores);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter entregadores", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const entregador = await entregadorRepo.getEntregadorById(
        Number(req.params.id)
      );
      if (!entregador)
        return res.status(404).json({ message: "Entregador não encontrado" });
      res.json(entregador);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar entregador", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const entregador = await entregadorRepo.updateEntregador(
        Number(req.params.id),
        req.body
      );
      if (!entregador)
        return res.status(404).json({ message: "Entregador não encontrado" });
      res.json(entregador);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao atualizar entregador",
        error: error.message,
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const entregador = await entregadorRepo.deleteEntregador(
        Number(req.params.id)
      );
      if (!entregador)
        return res.status(404).json({ message: "Entregador não encontrado" });
      res.json({ message: "Entregador deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar entregador", error: error.message });
    }
  }
}
