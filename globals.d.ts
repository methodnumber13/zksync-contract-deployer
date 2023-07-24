declare namespace NodeJS {
    export interface ProcessEnv {
        CONTRACT_NAME: string
        TOKEN_SYMBOL: string
        DECIMALS: string
        TOTAL_SUPPLY: string
        MAX_USD_FEE: string
        TIMEOUT_MS: string
    }
  }