import { PagamentoRepository } from "../repository/PagamentoRepository";
import {
  PagamentoCreationAttributes,
  PagamentoAttributes,
} from "../models/PagamentoModel";

const pagamentoRepo = new PagamentoRepository();

export class PagamentoService {
  async create(data: PagamentoCreationAttributes) {
    return await pagamentoRepo.createPagamento(data);
  }

  async getAll() {
    return await pagamentoRepo.getAllPagamentos();
  }

  async getById(id_pagamento: number) {
    return await pagamentoRepo.getPagamentoById(id_pagamento);
  }

  async update(id_pagamento: number, data: Partial<PagamentoAttributes>) {
    return await pagamentoRepo.updatePagamento(id_pagamento, data);
  }

  async delete(id_pagamento: number) {
    return await pagamentoRepo.deletePagamento(id_pagamento);
  }
}
