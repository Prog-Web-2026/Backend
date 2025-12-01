import { Request, Response } from "express";
import { PagamentoRepository } from "../repository/PagamentoRepository";

const pagamentoRepo = new PagamentoRepository();

export class PagamentoController {
  async create(req: Request, res: Response) {
    try {
      const pagamento = await pagamentoRepo.createPagamento(req.body);
      res.status(201).json(pagamento);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar pagamento", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const pagamentos = await pagamentoRepo.getAllPagamentos();
      res.json(pagamentos);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter pagamentos", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const pagamento = await pagamentoRepo.getPagamentoById(
        Number(req.params.id)
      );
      if (!pagamento)
        return res.status(404).json({ message: "Pagamento não encontrado" });
      res.json(pagamento);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar pagamento", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const pagamento = await pagamentoRepo.updatePagamento(
        Number(req.params.id),
        req.body
      );
      if (!pagamento)
        return res.status(404).json({ message: "Pagamento não encontrado" });
      res.json(pagamento);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar pagamento", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const pagamento = await pagamentoRepo.deletePagamento(
        Number(req.params.id)
      );
      if (!pagamento)
        return res.status(404).json({ message: "Pagamento não encontrado" });
      res.json({ message: "Pagamento deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar pagamento", error: error.message });
    }
  }
}
