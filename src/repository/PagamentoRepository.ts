import {
  Pagamento,
  PagamentoCreationAttributes,
} from "../models/PagamentoModel";

export class PagamentoRepository {
  async createPagamento(data: PagamentoCreationAttributes) {
    return await Pagamento.create(data);
  }

  async getAllPagamentos() {
    return await Pagamento.findAll();
  }

  async getPagamentoById(id_pagamento: number) {
    return await Pagamento.findByPk(id_pagamento);
  }

  async updatePagamento(id_pagamento: number, data: Partial<Pagamento>) {
    const pagamento = await Pagamento.findByPk(id_pagamento);
    if (!pagamento) return null;
    return await pagamento.update(data);
  }

  async deletePagamento(id_pagamento: number) {
    const pagamento = await Pagamento.findByPk(id_pagamento);
    if (!pagamento) return null;
    await pagamento.destroy();
    return pagamento;
  }
}
