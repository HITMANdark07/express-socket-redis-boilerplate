import { NextFunction, Request, Response } from "express";
import * as Joi from "joi";
import BadRequest from "../../responses/clientErrors/BadRequest";
import { ErrorDescription } from "../../common/constants";

// export const storeValidation: ValidationChain[] = [
//     body('task')
//         .isString().withMessage('must be string')
//         .exists().withMessage('is required'),

//     body('isCompleted')
//         .isBoolean().withMessage('must be boolean')
//         .exists().withMessage('is required')
// ];

export const storeValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    task: Joi.string().required().messages({
      "string.required": "Task name is required",
      "string.empty": "Task must not be empty",
    }),
    isCompleted: Joi.boolean().default(false).messages({
      "boolean.base": "isCompleted must be a boolean value",
    }),
  });

  try {
    await schema.validateAsync(req.body);
    next();
  } catch (err) {
    if (err instanceof Joi.ValidationError) {
      console.log(err);
      return next(
        new BadRequest(
          "INVALID_PAYLOAD",
          ErrorDescription.INVALID_PAYLOAD,
          err.details[0].message
        )
      );
    }
  }
};
