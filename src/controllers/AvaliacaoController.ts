import { Request, Response } from "express";
import { AvaliacaoService } from "../services/AvaliacaoService";

const avaliacaoService = new AvaliacaoService();

export class AvaliacaoController {
  async create(req: Request, res: Response) {
    try {
      const avaliacao = await avaliacaoService.create(req.body);
      res.status(201).json(avaliacao);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar avaliação", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const avaliacoes = await avaliacaoService.getAll();
      res.json(avaliacoes);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter avaliações", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const avaliacao = await avaliacaoService.getById(Number(req.params.id));
      if (!avaliacao)
        return res.status(404).json({ message: "Avaliação não encontrada" });
      res.json(avaliacao);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar avaliação", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const avaliacao = await avaliacaoService.update(
        Number(req.params.id),
        req.body
      );
      if (!avaliacao)
        return res.status(404).json({ message: "Avaliação não encontrada" });
      res.json(avaliacao);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar avaliação", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const avaliacao = await avaliacaoService.delete(Number(req.params.id));
      if (!avaliacao)
        return res.status(404).json({ message: "Avaliação não encontrada" });
      res.json({ message: "Avaliação deletada com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar avaliação", error: error.message });
    }
  }
}
