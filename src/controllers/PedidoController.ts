import { Request, Response } from "express";
import { PedidoRepository } from "../repository/PedidoRepository";

const pedidoRepo = new PedidoRepository();

export class PedidoController {
  async create(req: Request, res: Response) {
    try {
      const pedido = await pedidoRepo.createPedido(req.body);
      res.status(201).json(pedido);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar pedido", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const pedidos = await pedidoRepo.getAllPedidos();
      res.json(pedidos);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter pedidos", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const pedido = await pedidoRepo.getPedidoById(Number(req.params.id));
      if (!pedido)
        return res.status(404).json({ message: "Pedido não encontrado" });
      res.json(pedido);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar pedido", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const pedido = await pedidoRepo.updatePedido(
        Number(req.params.id),
        req.body
      );
      if (!pedido)
        return res.status(404).json({ message: "Pedido não encontrado" });
      res.json(pedido);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar pedido", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const pedido = await pedidoRepo.deletePedido(Number(req.params.id));
      if (!pedido)
        return res.status(404).json({ message: "Pedido não encontrado" });
      res.json({ message: "Pedido deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar pedido", error: error.message });
    }
  }
}
