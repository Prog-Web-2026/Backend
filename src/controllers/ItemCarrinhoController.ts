import { Request, Response } from "express";
import { ItemCarrinhoService } from "../services/ItemCarrinhoService";

const itemService = new ItemCarrinhoService();

export class ItemCarrinhoController {
  async create(req: Request, res: Response) {
    try {
      const item = await itemService.create(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao criar item do carrinho",
        error: error.message,
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const items = await itemService.getAll();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao obter itens do carrinho",
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id_carrinho, id_produto } = req.params;
      const item = await itemService.getById(
        Number(id_carrinho),
        Number(id_produto)
      );
      if (!item)
        return res.status(404).json({ message: "Item não encontrado" });
      res.json(item);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar item", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id_carrinho, id_produto } = req.params;
      const item = await itemService.update(
        Number(id_carrinho),
        Number(id_produto),
        req.body
      );
      if (!item)
        return res.status(404).json({ message: "Item não encontrado" });
      res.json(item);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar item", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id_carrinho, id_produto } = req.params;
      const item = await itemService.delete(
        Number(id_carrinho),
        Number(id_produto)
      );
      if (!item)
        return res.status(404).json({ message: "Item não encontrado" });
      res.json({ message: "Item deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar item", error: error.message });
    }
  }
}
