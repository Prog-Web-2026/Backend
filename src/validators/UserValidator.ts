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
  role: Joi.string().valid("admin", "customer", "delivery").optional(),
});

export const updateAddressSchema = Joi.object({
  street: Joi.string().required().min(3).max(200),
  number: Joi.string().required().min(1).max(10),
  complement: Joi.string().optional().allow("").max(100),
  neighborhood: Joi.string().required().min(2).max(100),
  city: Joi.string().required().min(2).max(100),
  state: Joi.string().required().length(2).uppercase(),
  zipCode: Joi.string()
    .required()
    .pattern(/^\d{5}-?\d{3}$/),
  country: Joi.string().optional().allow("").default("Brasil").max(50),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
});

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
