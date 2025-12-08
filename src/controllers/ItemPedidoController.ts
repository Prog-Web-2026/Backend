import { Request, Response } from "express";
import { ItemPedidoService } from "../services/ItemPedidoService";

const itemService = new ItemPedidoService();

export class ItemPedidoController {
  async create(req: Request, res: Response) {
    try {
      const item = await itemService.create(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({
        message: "Erro ao criar item do pedido",
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
        message: "Erro ao obter itens do pedido",
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id_pedido, id_produto } = req.params;
      const item = await itemService.getById(
        Number(id_pedido),
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
      const { id_pedido, id_produto } = req.params;
      const item = await itemService.update(
        Number(id_pedido),
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
      const { id_pedido, id_produto } = req.params;
      const item = await itemService.delete(
        Number(id_pedido),
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
