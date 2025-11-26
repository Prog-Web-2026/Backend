import { Request, Response } from "express";
import { ItemCarrinhoRepository } from "../repository/ItemCarrinhoRepository";

const itemRepo = new ItemCarrinhoRepository();

export class ItemCarrinhoController {
  async create(req: Request, res: Response) {
    try {
      const item = await itemRepo.createItem(req.body);
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
      const items = await itemRepo.getAllItems();
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
      const item = await itemRepo.getItemById(
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
      const item = await itemRepo.updateItem(
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
      const item = await itemRepo.deleteItem(
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
