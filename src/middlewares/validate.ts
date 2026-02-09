import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

const INVALID_CASES: Record<string, string> = {
  "any.required": "INVALID_IS_NULL",
  "string.empty": "INVALID_IS_EMPTY",
  "string.email": "INVALID_EMAIL",
  "string.pattern.base": "INVALID_FORMAT",
  "string.min": "INVALID_TOO_SHORT",
  "string.max": "INVALID_TOO_LONG",
  "number.base": "INVALID_NUMBER",
  "number.min": "INVALID_TOO_SMALL",
  "number.max": "INVALID_TOO_LARGE",
  "date.base": "INVALID_DATE",
  "array.base": "INVALID_ARRAY",
  "array.min": "INVALID_TOO_SMALL",
  "array.max": "INVALID_TOO_LARGE",
};

export const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (!error) return next();

    const details: Record<string, string> = {};
    error.details.forEach((err) => {
      const key = err.path.join(".");
      const code = INVALID_CASES[err.type] || "INVALID";
      details[key] = code;
    });

    return res.status(400).json({ details });
  };
};
