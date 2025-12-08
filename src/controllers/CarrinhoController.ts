import { Request, Response } from "express";
import { CarrinhoService } from "../services/CarrinhoService";

const carrinhoService = new CarrinhoService();

export class CarrinhoController {
  async create(req: Request, res: Response) {
    try {
      const carrinho = await carrinhoService.create(req.body);
      res.status(201).json(carrinho);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar carrinho", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const carrinhos = await carrinhoService.getAll();
      res.json(carrinhos);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter carrinhos", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const carrinho = await carrinhoService.getById(Number(req.params.id));
      if (!carrinho)
        return res.status(404).json({ message: "Carrinho não encontrado" });
      res.json(carrinho);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar carrinho", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const carrinho = await carrinhoService.update(
        Number(req.params.id),
        req.body
      );
      if (!carrinho)
        return res.status(404).json({ message: "Carrinho não encontrado" });
      res.json(carrinho);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar carrinho", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const carrinho = await carrinhoService.delete(Number(req.params.id));
      if (!carrinho)
        return res.status(404).json({ message: "Carrinho não encontrado" });
      res.json({ message: "Carrinho deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar carrinho", error: error.message });
    }
  }
}
