import { Request, Response } from "express";
import { CartaoPagamentoService } from "../services/CartaoPagamentoService";

const cartaoService = new CartaoPagamentoService();

export class CartaoPagamentoController {
  async create(req: Request, res: Response) {
    try {
      const cartao = await cartaoService.create(req.body);
      res.status(201).json(cartao);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar cartão", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const cartoes = await cartaoService.getAll();
      res.json(cartoes);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter cartões", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const cartao = await cartaoService.getById(Number(req.params.id));
      if (!cartao)
        return res.status(404).json({ message: "Cartão não encontrado" });
      res.json(cartao);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar cartão", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const cartao = await cartaoService.update(
        Number(req.params.id),
        req.body
      );
      if (!cartao)
        return res.status(404).json({ message: "Cartão não encontrado" });
      res.json(cartao);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar cartão", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const cartao = await cartaoService.delete(Number(req.params.id));
      if (!cartao)
        return res.status(404).json({ message: "Cartão não encontrado" });
      res.json({ message: "Cartão deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar cartão", error: error.message });
    }
  }
}
