import { Request, Response } from "express";
import { ProdutoService } from "../services/ProdutoService";

const produtoService = new ProdutoService();

export class ProdutoController {
  async create(req: Request, res: Response) {
    try {
      const produto = await produtoService.create(req.body);
      res.status(201).json(produto);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar produto", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const produtos = await produtoService.getAll();
      res.json(produtos);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter produtos", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const produto = await produtoService.getById(Number(req.params.id));
      if (!produto)
        return res.status(404).json({ message: "Produto não encontrado" });
      res.json(produto);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar produto", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const produto = await produtoService.update(
        Number(req.params.id),
        req.body
      );
      if (!produto)
        return res.status(404).json({ message: "Produto não encontrado" });
      res.json(produto);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar produto", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const produto = await produtoService.delete(Number(req.params.id));
      if (!produto)
        return res.status(404).json({ message: "Produto não encontrado" });
      res.json({ message: "Produto deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar produto", error: error.message });
    }
  }
}
