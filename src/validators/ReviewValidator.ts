import Joi from "joi";
import { validate } from "../validate";

export class ReviewValidator {
  static addReview(body: any) {
    const schema = Joi.object({
      rating: Joi.number().integer().min(1).max(5).required().messages({
        "any.required": '"rating" é obrigatório',
        "number.base": '"rating" deve ser um número',
        "number.integer": '"rating" deve ser um inteiro',
        "number.min": '"rating" deve ser no mínimo 1',
        "number.max": '"rating" deve ser no máximo 5',
      }),
      comment: Joi.string().min(3).optional().allow("", null).messages({
        "string.min": '"comment" deve ter pelo menos 3 caracteres',
      }),
    });

    return validate(schema, body);
  }

  static updateReview(body: any) {
    const schema = Joi.object({
      rating: Joi.number().integer().min(1).max(5).optional().messages({
        "number.base": '"rating" deve ser um número',
        "number.integer": '"rating" deve ser um inteiro',
        "number.min": '"rating" deve ser no mínimo 1',
        "number.max": '"rating" deve ser no máximo 5',
      }),
      comment: Joi.string().min(3).optional().allow("", null).messages({
        "string.min": '"comment" deve ter pelo menos 3 caracteres',
      }),
    });

    return validate(schema, body);
  }

  static reportReview(body: any) {
    const schema = Joi.object({
      details: Joi.string().min(5).required().messages({
        "any.required": '"details" é obrigatório',
        "string.base": '"details" deve ser uma string',
        "string.min": '"details" deve ter pelo menos 5 caracteres',
        "string.empty": '"details" não pode ser vazio',
      }),
    });

    return validate(schema, body);
  }

  static toggleStatus(body: any) {
    const schema = Joi.object({
      isActive: Joi.boolean().required().messages({
        "any.required": '"isActive" é obrigatório',
        "boolean.base": '"isActive" deve ser um booleano',
      }),
    });

    return validate(schema, body);
  }
}
