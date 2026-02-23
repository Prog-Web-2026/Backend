import Joi from "joi";
import { validate } from "../validate";

export class AuthValidator {
  static register(body: any) {
    const schema = Joi.object({
      name: Joi.string().min(2).required().messages({
        "any.required": '"name" é obrigatório',
        "string.base": '"name" deve ser uma string',
        "string.min": '"name" deve ter pelo menos 2 caracteres',
        "string.empty": '"name" não pode ser vazio',
      }),
      email: Joi.string().email().required().messages({
        "any.required": '"email" é obrigatório',
        "string.email": '"email" deve ser um email válido',
        "string.empty": '"email" não pode ser vazio',
      }),
      password: Joi.string().min(6).required().messages({
        "any.required": '"password" é obrigatório',
        "string.base": '"password" deve ser uma string',
        "string.min": '"password" deve ter pelo menos 6 caracteres',
        "string.empty": '"password" não pode ser vazio',
      }),
      role: Joi.string().valid("customer", "delivery").optional().messages({
        "any.only": '"role" deve ser "customer" ou "delivery"',
      }),
      phone: Joi.string().optional().allow("", null),
      address: Joi.object().optional(),
    });

    return validate(schema, body);
  }

  static login(body: any) {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "any.required": '"email" é obrigatório',
        "string.email": '"email" deve ser um email válido',
        "string.empty": '"email" não pode ser vazio',
      }),
      password: Joi.string().required().messages({
        "any.required": '"password" é obrigatório',
        "string.empty": '"password" não pode ser vazio',
      }),
    });

    return validate(schema, body);
  }

  static changePassword(body: any) {
    const schema = Joi.object({
      currentPassword: Joi.string().required().messages({
        "any.required": '"currentPassword" é obrigatório',
        "string.empty": '"currentPassword" não pode ser vazio',
      }),
      newPassword: Joi.string().min(6).required().messages({
        "any.required": '"newPassword" é obrigatório',
        "string.min": '"newPassword" deve ter pelo menos 6 caracteres',
        "string.empty": '"newPassword" não pode ser vazio',
      }),
    });

    return validate(schema, body);
  }
}
