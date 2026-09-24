import { Request, Response, NextFunction } from "express";
import { expenseService } from "../services/expense.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const expenseController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const { expense, participants } = await expenseService.createExpense(req.user.id, req.body);
      sendSuccess(res, { expense, participants }, 201);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const { items, pagination } = await expenseService.listExpenses(req.user.id, req.query as never);
      sendPaginated(res, items, pagination);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const { expense, participants } = await expenseService.getExpense(req.params.expenseId, req.user.id);
      sendSuccess(res, { expense, participants });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const expense = await expenseService.updateExpense(req.params.expenseId, req.user.id, req.body);
      sendSuccess(res, { expense });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      await expenseService.deleteExpense(req.params.expenseId, req.user.id);
      sendSuccess(res, { message: "Expense deleted" });
    } catch (err) {
      next(err);
    }
  }
};
