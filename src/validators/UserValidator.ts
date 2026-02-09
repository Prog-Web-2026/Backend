import Joi, { ObjectSchema } from "joi";
import { ValidationError } from "../config/ErrorHandler";
import { UserRole } from "../models/UserModel";

export const errorCodes = {
  REQUIRED: "INVALID_IS_EMPTY",
  EMAIL: "INVALID_EMAIL",
  ZIPCODE: "INVALID_ZIPCODE",
  NUMBER: "INVALID_NUMBER",
  EXPIRATION: "INVALID_EXPIRATION",
};

export const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  role: Joi.string().valid("admin", "customer", "delivery").optional(), // permite role
});

export const updateAddressSchema: ObjectSchema = Joi.object({
  street: Joi.string()
    .required()
    .messages({ "any.required": errorCodes.REQUIRED }),
  number: Joi.string()
    .required()
    .messages({ "any.required": errorCodes.REQUIRED }),
  neighborhood: Joi.string()
    .required()
    .messages({ "any.required": errorCodes.REQUIRED }),
  city: Joi.string()
    .required()
    .messages({ "any.required": errorCodes.REQUIRED }),
  state: Joi.string()
    .required()
    .messages({ "any.required": errorCodes.REQUIRED }),
  zipCode: Joi.string()
    .required()
    .messages({ "any.required": errorCodes.REQUIRED }),
});

// Adicionar método de pagamento
export const addPaymentMethodSchema: ObjectSchema = Joi.object({
  type: Joi.string()
    .valid("credit_card", "debit_card", "pix", "boleto")
    .required()
    .messages({ "any.required": errorCodes.REQUIRED }),
  cardHolderName: Joi.string().when("type", {
    is: Joi.valid("credit_card", "debit_card"),
    then: Joi.required().messages({ "any.required": errorCodes.REQUIRED }),
    otherwise: Joi.forbidden(),
  }),
  cardNumber: Joi.string()
    .creditCard()
    .when("type", {
      is: Joi.valid("credit_card", "debit_card"),
      then: Joi.required().messages({ "any.required": errorCodes.REQUIRED }),
      otherwise: Joi.forbidden(),
    }),
  cardExpiryMonth: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .when("type", {
      is: Joi.valid("credit_card", "debit_card"),
      then: Joi.required().messages({ "any.required": errorCodes.REQUIRED }),
      otherwise: Joi.forbidden(),
    }),
  cardExpiryYear: Joi.number()
    .integer()
    .min(new Date().getFullYear())
    .when("type", {
      is: Joi.valid("credit_card", "debit_card"),
      then: Joi.required().messages({ "any.required": errorCodes.EXPIRATION }),
      otherwise: Joi.forbidden(),
    }),
  cardCvv: Joi.string()
    .pattern(/^\d{3,4}$/)
    .when("type", {
      is: Joi.valid("credit_card", "debit_card"),
      then: Joi.required().messages({ "any.required": errorCodes.REQUIRED }),
      otherwise: Joi.forbidden(),
    }),
  isDefault: Joi.boolean().optional(),
});