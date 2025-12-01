import { Produto, ProdutoCreationAttributes } from "../models/ProdutoModel";

export class ProdutoRepository {
  async createProduto(data: ProdutoCreationAttributes) {
    return await Produto.create(data);
  }

  async getAllProdutos() {
    return await Produto.findAll();
  }

  async getProdutoById(id_produto: number) {
    return await Produto.findByPk(id_produto);
  }

  async updateProduto(id_produto: number, data: Partial<Produto>) {
    const produto = await Produto.findByPk(id_produto);
    if (!produto) return null;
    return await produto.update(data);
  }

  async deleteProduto(id_produto: number) {
    const produto = await Produto.findByPk(id_produto);
    if (!produto) return null;
    await produto.destroy();
    return produto;
  }
}
