import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../utils/errors";

/**
 * Validates req.body/req.params/req.query against a Zod schema shaped like
 * { body?, params?, query? }. On success, the parsed (and coerced) values
 * are written back onto the request so controllers receive clean data.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      });

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined) req.params = parsed.params;
      if (parsed.query !== undefined) req.query = parsed.query;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        next(new ValidationError(message, err.flatten()));
        return;
      }
      next(err);
    }
  };
}
