import { Router } from "express";
import { expenseController } from "../controllers/expense.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema
} from "../validators/expense.validator";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createExpenseSchema), expenseController.create);
router.get("/", validate(listExpensesQuerySchema), expenseController.list);
router.get("/:expenseId", validate(expenseIdParamSchema), expenseController.getOne);
router.patch("/:expenseId", validate(updateExpenseSchema), expenseController.update);
router.delete("/:expenseId", validate(expenseIdParamSchema), expenseController.remove);

export default router;
