import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().allow("").optional(),
  price: Joi.number().greater(0).required(),
  stock: Joi.number().min(0).required(),
  categoryId: Joi.number().integer().required(),
  isActive: Joi.boolean().optional(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  description: Joi.string().allow("").optional(),
  price: Joi.number().greater(0).optional(),
  stock: Joi.number().min(0).optional(),
  categoryId: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
});

export const updateStockSchema = Joi.object({
  quantity: Joi.number().integer().required(),
  operation: Joi.string().valid("add", "subtract", "set").required(),
});
