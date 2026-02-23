import Joi from "joi";
import { validate } from "../validate";

export class OrderValidator {
  static createOrder(body: any) {
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
      notes: Joi.string().optional().allow("", null),
    });

    return validate(schema, body);
  }

  static updateStatus(body: any) {
    const schema = Joi.object({
      status: Joi.string()
        .valid(
          "confirmed",
          "preparing",
          "ready_for_pickup",
          "out_for_delivery",
          "delivered",
          "cancelled",
        )
        .required()
        .messages({
          "any.required": '"status" é obrigatório',
          "any.only":
            '"status" deve ser um dos valores: confirmed, preparing, ready_for_pickup, out_for_delivery, delivered, cancelled',
          "string.empty": '"status" não pode ser vazio',
        }),
    });

    return validate(schema, body);
  }

  static processPayment(body: any) {
    const schema = Joi.object({
      type: Joi.string()
        .valid("credit_card", "debit_card", "pix")
        .required()
        .messages({
          "any.required": '"type" é obrigatório',
          "any.only":
            '"type" deve ser um dos valores: credit_card, debit_card, pix',
          "string.empty": '"type" não pode ser vazio',
        }),
      cardHolderName: Joi.string().when("type", {
        is: Joi.valid("credit_card", "debit_card"),
        then: Joi.optional(),
        otherwise: Joi.forbidden(),
      }),
      cardNumber: Joi.string().when("type", {
        is: Joi.valid("credit_card", "debit_card"),
        then: Joi.optional(),
        otherwise: Joi.forbidden(),
      }),
      cardExpiryMonth: Joi.number()
        .integer()
        .min(1)
        .max(12)
        .when("type", {
          is: Joi.valid("credit_card", "debit_card"),
          then: Joi.optional(),
          otherwise: Joi.forbidden(),
        }),
      cardExpiryYear: Joi.number()
        .integer()
        .min(new Date().getFullYear())
        .when("type", {
          is: Joi.valid("credit_card", "debit_card"),
          then: Joi.optional(),
          otherwise: Joi.forbidden(),
        }),
      cardCvv: Joi.string()
        .pattern(/^\d{3,4}$/)
        .when("type", {
          is: Joi.valid("credit_card", "debit_card"),
          then: Joi.optional(),
          otherwise: Joi.forbidden(),
        }),
      isDefault: Joi.boolean().optional(),
    });

    return validate(schema, body);
  }
}
