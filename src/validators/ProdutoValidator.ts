import Joi from "joi";

export class ProdutoValidator {
  static createProdutoSchema = Joi.object({
    nome: Joi.string().min(1).max(200).required().messages({
      "string.empty": "Nome não pode estar vazio",
      "any.required": "Nome é obrigatório",
    }),
    descricao: Joi.string().optional().allow(null, "").messages({
      "string.base": "Descrição deve ser uma string",
    }),
    preco: Joi.number().precision(2).positive().required().messages({
      "number.base": "Preço deve ser um número",
      "number.positive": "Preço deve ser um valor positivo",
      "any.required": "Preço é obrigatório",
    }),
    estoque: Joi.number().integer().min(0).required().messages({
      "number.base": "Estoque deve ser um número",
      "number.min": "Estoque não pode ser negativo",
      "any.required": "Estoque é obrigatório",
    }),
    categoria: Joi.string().optional().allow(null, ""),
    imagem_url: Joi.string().uri().optional().allow(null, "").messages({
      "string.uri": "Imagem deve ser uma URL válida",
    }),
  });

  static updateProdutoSchema = Joi.object({
    nome: Joi.string().min(1).max(200).optional(),
    descricao: Joi.string().optional().allow(null, ""),
    preco: Joi.number().precision(2).positive().optional(),
    estoque: Joi.number().integer().min(0).optional(),
    categoria: Joi.string().optional().allow(null, ""),
    imagem_url: Joi.string().uri().optional().allow(null, ""),
  });
}
