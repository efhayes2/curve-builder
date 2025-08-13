type Rates = {
  lendingRate: number
  borrowingRate: number
}

export type BankRate = {
  mint: string
  symbol: string
  rates: {
    mfi: Rates
    kamino: Rates
  }
}

export type ProtocolDataRow = {
  protocol: string;
  token: string;
  category: string;
  liquidity: number | string;
  currentUtilization: number | string;
  targetUtilization: number | string;
  plateauRate: number | string;
  maxRate: number | string;
  lendingRate: number | string;
  borrowingRate: number | string;
  collateralWeight: number | string;
  liabilityWeight: number | string;
  ltv: number | string;
  borrowCap: number | string;
  depositCap: number | string;
  flashLoanFee: number | string;
  fixedHostInterestRate: number | string;
  borrowFee: number | string;
};
