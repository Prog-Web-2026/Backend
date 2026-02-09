import Joi from "joi";

export class PedidoValidator {
  static statuses = [
    "aguardando_pagamento",
    "pago",
    "em_preparacao",
    "em_transporte",
    "entregue",
    "cancelado",
  ];

  static createPedidoSchema = Joi.object({
    id_cliente: Joi.number().integer().required().messages({
      "number.base": "id_cliente deve ser numérico",
      "any.required": "id_cliente é obrigatório",
    }),
    id_endereco_entrega: Joi.number().integer().required().messages({
      "number.base": "id_endereco_entrega deve ser numérico",
      "any.required": "id_endereco_entrega é obrigatório",
    }),
    total: Joi.number().precision(2).positive().required().messages({
      "number.base": "Total deve ser numérico",
      "number.positive": "Total deve ser positivo",
      "any.required": "Total é obrigatório",
    }),
    status: Joi.string()
      .valid(...PedidoValidator.statuses)
      .optional()
      .messages({
        "any.only": `Status inválido. Valores permitidos: ${PedidoValidator.statuses.join(", ")}`,
      }),
  });

  static updatePedidoSchema = Joi.object({
    id_cliente: Joi.number().integer().optional(),
    id_endereco_entrega: Joi.number().integer().optional(),
    total: Joi.number().precision(2).positive().optional(),
    status: Joi.string().valid(...PedidoValidator.statuses).optional(),
  });
}
