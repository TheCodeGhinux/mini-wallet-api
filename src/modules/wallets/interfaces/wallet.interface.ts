export interface IWallet {
  user?: string;
  balance?: number;
  currency?: string;
}

export interface IFundWallet {
  amount: number;
  currency?: string;
  userId?: string;
  walletId?: string;
  metadata?: Record<string, unknown>;
}

export interface ITransferFunds {
  targetAccountNumber: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
}
