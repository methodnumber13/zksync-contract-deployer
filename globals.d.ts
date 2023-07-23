declare namespace NodeJS {
    export interface ProcessEnv {
        CONTRACT_NAME: string
        TOKEN_SYMBOL: string
        DECIMALS: string
        TOTAL_SUPPLY: string
        PRIVATE_KEY: string
        MAX_USD_FEE: string
        OPENAI_API_KEY: string
    }
  }