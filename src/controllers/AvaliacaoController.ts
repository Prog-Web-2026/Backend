import { Request, Response } from "express";
import { AvaliacaoRepository } from "../repository/AvaliacaoRepository";

const avaliacaoRepo = new AvaliacaoRepository();

export class AvaliacaoController {
  async create(req: Request, res: Response) {
    try {
      const avaliacao = await avaliacaoRepo.createAvaliacao(req.body);
      res.status(201).json(avaliacao);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar avaliação", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const avaliacoes = await avaliacaoRepo.getAllAvaliacoes();
      res.json(avaliacoes);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter avaliações", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const avaliacao = await avaliacaoRepo.getAvaliacaoById(
        Number(req.params.id)
      );
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
      const avaliacao = await avaliacaoRepo.updateAvaliacao(
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
      const avaliacao = await avaliacaoRepo.deleteAvaliacao(
        Number(req.params.id)
      );
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
