import Joi from "joi";

export class UserValidator {
  // Esquema para criação de usuário
  static createUserSchema = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      "string.empty": "Nome não pode estar vazio",
      "string.min": "Nome deve ter no mínimo 3 caracteres",
      "string.max": "Nome deve ter no máximo 100 caracteres",
      "any.required": "Nome é obrigatório",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Email deve ser válido",
      "any.required": "Email é obrigatório",
    }),
    password: Joi.string().min(6).max(100).required().messages({
      "string.empty": "Senha não pode estar vazia",
      "string.min": "Senha deve ter no mínimo 6 caracteres",
      "string.max": "Senha deve ter no máximo 100 caracteres",
      "any.required": "Senha é obrigatória",
    }),
  });

  // Esquema para login
  static loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email deve ser válido",
      "any.required": "Email é obrigatório",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Senha não pode estar vazia",
      "any.required": "Senha é obrigatória",
    }),
  });

  // Esquema para atualizar usuário
  static updateUserSchema = Joi.object({
    name: Joi.string().min(3).max(100).optional().messages({
      "string.min": "Nome deve ter no mínimo 3 caracteres",
      "string.max": "Nome deve ter no máximo 100 caracteres",
    }),
    email: Joi.string().email().optional().messages({
      "string.email": "Email deve ser válido",
    }),
    password: Joi.string().min(6).max(100).optional().messages({
      "string.min": "Senha deve ter no mínimo 6 caracteres",
      "string.max": "Senha deve ter no máximo 100 caracteres",
    }),
  });

  // Método para validar
  static validate(schema: Joi.Schema, data: any) {
    return schema.validate(data, { abortEarly: false });
  }
}
