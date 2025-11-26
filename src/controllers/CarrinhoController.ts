import { Request, Response } from "express";
import { CarrinhoRepository } from "../repository/CarrinhoRepository";

const carrinhoRepo = new CarrinhoRepository();

export class CarrinhoController {
  async create(req: Request, res: Response) {
    try {
      const carrinho = await carrinhoRepo.createCarrinho(req.body);
      res.status(201).json(carrinho);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar carrinho", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const carrinhos = await carrinhoRepo.getAllCarrinhos();
      res.json(carrinhos);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter carrinhos", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const carrinho = await carrinhoRepo.getCarrinhoById(
        Number(req.params.id)
      );
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
      const carrinho = await carrinhoRepo.updateCarrinho(
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
      const carrinho = await carrinhoRepo.deleteCarrinho(Number(req.params.id));
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
