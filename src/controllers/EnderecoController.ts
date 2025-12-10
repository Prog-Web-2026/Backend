import { Request, Response } from "express";
import { EnderecoService } from "../services/EnderecoService";

const enderecoService = new EnderecoService();

export class EnderecoController {
  async create(req: Request, res: Response) {
    try {
      const endereco = await enderecoService.create(req.body);
      res.status(201).json(endereco);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao criar endereço", error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const enderecos = await enderecoService.getAll();
      res.json(enderecos);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao obter endereços", error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const endereco = await enderecoService.getById(Number(req.params.id));
      if (!endereco)
        return res.status(404).json({ message: "Endereço não encontrado" });
      res.json(endereco);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao buscar endereço", error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const endereco = await enderecoService.update(
        Number(req.params.id),
        req.body
      );
      if (!endereco)
        return res.status(404).json({ message: "Endereço não encontrado" });
      res.json(endereco);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao atualizar endereço", error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const endereco = await enderecoService.delete(Number(req.params.id));
      if (!endereco)
        return res.status(404).json({ message: "Endereço não encontrado" });
      res.json({ message: "Endereço deletado com sucesso" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao deletar endereço", error: error.message });
    }
  }
}
