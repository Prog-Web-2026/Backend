import Joi from "joi";

export class ClienteValidator {
  static createClienteSchema = Joi.object({
    nome: Joi.string().min(3).max(100).required().messages({
      "string.empty": "Nome não pode estar vazio",
      "string.min": "Nome deve ter no mínimo 3 caracteres",
      "string.max": "Nome deve ter no máximo 100 caracteres",
      "any.required": "Nome é obrigatório",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Email deve ser válido",
      "any.required": "Email é obrigatório",
    }),
    senha: Joi.string().min(6).max(100).optional().messages({
      "string.min": "Senha deve ter no mínimo 6 caracteres",
      "string.max": "Senha deve ter no máximo 100 caracteres",
    }),
    telefone: Joi.string().optional().messages({
      "string.base": "Telefone deve ser uma string",
    }),
  });

  static updateClienteSchema = Joi.object({
    nome: Joi.string().min(3).max(100).optional().messages({
      "string.min": "Nome deve ter no mínimo 3 caracteres",
      "string.max": "Nome deve ter no máximo 100 caracteres",
    }),
    email: Joi.string().email().optional().messages({
      "string.email": "Email deve ser válido",
    }),
    senha: Joi.string().min(6).max(100).optional().messages({
      "string.min": "Senha deve ter no mínimo 6 caracteres",
      "string.max": "Senha deve ter no máximo 100 caracteres",
    }),
    telefone: Joi.string().optional().messages({
      "string.base": "Telefone deve ser uma string",
    }),
  });
}
