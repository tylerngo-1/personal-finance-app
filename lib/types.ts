export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "CREDIT_CARD"
  | "CASH"
  | "INVESTMENT"
  | "FUNDING"
  | "INSURANCE";

export type AccountNature = "ASSET" | "LIABILITY";

export type TransactionType = "INCOME" | "EXPENSE";

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  createdAt: string;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  createdAt: string;
  accountId: string;
  categoryId: string;
  account?: Account;
  category?: Category;
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  createdAt: string;
  transactions?: Transaction[];
};
