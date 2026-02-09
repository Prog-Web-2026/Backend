import { ObjectSchema } from "joi";
import { ValidationError } from "./config/ErrorHandler";

export const validate = (schema: ObjectSchema, body: any) => {
  const { error } = schema.validate(body, {
    abortEarly: false,
    allowUnknown: false,
  });
  if (error) {
    const details: Record<string, string> = {};
    error.details.forEach((d) => {
      const key = d.path[0] as string;
      details[key] = d.message;
    });
    throw new ValidationError("Erro de validação", 400, details);
  }
};
