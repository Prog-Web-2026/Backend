import Joi from "joi";
import { validate } from "../validate";

export class CategoryValidator {
  static createCategory(body: any) {
    const schema = Joi.object({
      name: Joi.string().min(2).required().messages({
        "any.required": '"name" é obrigatório',
        "string.base": '"name" deve ser uma string',
        "string.min": '"name" deve ter pelo menos 2 caracteres',
        "string.empty": '"name" não pode ser vazio',
      }),
      description: Joi.string().optional().allow("", null),
      isActive: Joi.boolean().optional().messages({
        "boolean.base": '"isActive" deve ser um booleano',
      }),
    });

    return validate(schema, body);
  }

  static updateCategory(body: any) {
    const schema = Joi.object({
      name: Joi.string().min(2).optional().messages({
        "string.base": '"name" deve ser uma string',
        "string.min": '"name" deve ter pelo menos 2 caracteres',
      }),
      description: Joi.string().optional().allow("", null),
      isActive: Joi.boolean().optional().messages({
        "boolean.base": '"isActive" deve ser um booleano',
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
