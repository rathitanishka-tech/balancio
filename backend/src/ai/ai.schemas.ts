import { z } from "zod";

// Schema for parsing a natural language expense or receipt
export const ExpenseDraftSchema = z.object({
  intent: z.enum(["CREATE_EXPENSE", "ASK_QUESTION", "UNKNOWN"]).describe("The primary intent of the user input."),
  title: z.string().optional().describe("A short, descriptive title for the expense."),
  amountMinor: z.number().int().positive().optional().describe("The total amount in minor units (e.g. cents, paise). E.g., ₹2400 is 240000."),
  currency: z.string().optional().describe("The currency code, e.g. USD, INR."),
  date: z.string().optional().describe("ISO 8601 date string, e.g. '2026-09-22'"),
  paidBy: z.object({
    type: z.enum(["CURRENT_USER", "SPECIFIC_USER"]),
    name: z.string().optional().describe("Name of the user if type is SPECIFIC_USER")
  }).optional(),
  participants: z.array(
    z.object({
      name: z.string(),
      share: z.number().optional().describe("Used if splitType is CUSTOM or PERCENTAGE")
    })
  ).optional().describe("List of people involved in the expense, including the payer if applicable."),
  splitType: z.enum(["EQUAL", "PERCENTAGE", "CUSTOM", "EXACT"]).optional(),
  category: z.enum([
    "FOOD", "TRAVEL", "SHOPPING", "ENTERTAINMENT", "BILLS", 
    "HEALTH", "EDUCATION", "RENT", "GROCERIES", "OTHER"
  ]).optional(),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(1).describe("Estimated confidence in the extraction (0 to 1).")
});

export type ExpenseDraft = z.infer<typeof ExpenseDraftSchema>;

export const ReceiptExtractionSchema = z.object({
  merchant: z.string().optional(),
  date: z.string().optional(),
  currency: z.string().optional(),
  subtotalMinor: z.number().int().optional(),
  taxMinor: z.number().int().optional(),
  totalMinor: z.number().int().optional(),
  category: z.enum([
    "FOOD", "TRAVEL", "SHOPPING", "ENTERTAINMENT", "BILLS", 
    "HEALTH", "EDUCATION", "RENT", "GROCERIES", "OTHER"
  ]).optional(),
  lineItems: z.array(
    z.object({
      name: z.string(),
      amountMinor: z.number().int()
    })
  ).optional(),
  confidence: z.number().min(0).max(1)
});

export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

export const IntentClassificationSchema = z.object({
  intent: z.enum([
    "GREETING",
    "GENERAL_HELP",
    "FINANCIAL_QUERY",
    "EXPENSE_CREATION_INTENT",
    "BALANCE_QUERY",
    "DEBT_QUERY",
    "SPENDING_QUERY",
    "CATEGORY_QUERY",
    "GROUP_QUERY",
    "SETTLEMENT_QUERY",
    "UNKNOWN"
  ]).describe("The core intent of the user's message"),
  confidence: z.number().min(0).max(1).describe("Confidence in intent classification"),
});

export type IntentClassification = z.infer<typeof IntentClassificationSchema>;
