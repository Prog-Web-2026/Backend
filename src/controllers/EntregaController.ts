import { Request, Response } from "express";
import { EntregaService } from "../services/EntregaService";

const entregaService = new EntregaService();

export class EntregaController {
  async create(req: Request, res: Response) {
    try {
      const entrega = await entregaService.create(req.body);
      res.status(201).json(entrega);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar entrega", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const entregas = await entregaService.getAll();
      res.json(entregas);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter entregas", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const entrega = await entregaService.getById(Number(req.params.id));
      if (!entrega)
        return res.status(404).json({ message: "Entrega não encontrada" });
      res.json(entrega);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar entrega", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const entrega = await entregaService.update(
        Number(req.params.id),
        req.body
      );
      if (!entrega)
        return res.status(404).json({ message: "Entrega não encontrada" });
      res.json(entrega);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar entrega", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const entrega = await entregaService.delete(Number(req.params.id));
      if (!entrega)
        return res.status(404).json({ message: "Entrega não encontrada" });
      res.json({ message: "Entrega deletada com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar entrega", error: error.message });
    }
  }
}
