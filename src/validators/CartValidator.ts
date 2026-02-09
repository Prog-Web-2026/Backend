import Joi from "joi";
import { validate } from "../validate";

export class CartValidator {
  static addToCart(body: any) {
    const schema = Joi.object({
      productId: Joi.number().integer().positive().required().messages({
        "any.required": '"productId" é obrigatório',
        "number.base": '"productId" deve ser um número',
        "number.positive": '"productId" deve ser positivo',
      }),
      quantity: Joi.number().integer().positive().required().messages({
        "any.required": '"quantity" é obrigatório',
        "number.base": '"quantity" deve ser um número',
        "number.integer": '"quantity" deve ser um inteiro',
        "number.positive": '"quantity" deve ser maior que zero',
      }),
    });

    return validate(schema, body);
  }

  static checkout(body: any) {
    const schema = Joi.object({
      selectedCartItemIds: Joi.array()
        .items(Joi.number().integer().positive())
        .min(1)
        .required()
        .messages({
          "any.required": '"selectedCartItemIds" é obrigatório',
          "array.base": '"selectedCartItemIds" deve ser um array',
          "array.min": '"selectedCartItemIds" deve conter pelo menos 1 item',
          "number.base":
            'Cada item em "selectedCartItemIds" deve ser um número',
          "number.positive":
            'Cada item em "selectedCartItemIds" deve ser positivo',
          "number.integer":
            'Cada item em "selectedCartItemIds" deve ser inteiro',
        }),
    });

    return validate(schema, body);
  }

  static updateCartItem(body: any) {
    const schema = Joi.object({
      quantity: Joi.number().integer().positive().required().messages({
        "any.required": '"quantity" é obrigatório',
        "number.base": '"quantity" deve ser um número',
        "number.integer": '"quantity" deve ser inteiro',
        "number.positive": '"quantity" deve ser maior que zero',
      }),
    });

    return validate(schema, body);
  }
}
