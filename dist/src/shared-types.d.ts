/**
 * Serializable configuration for the connection
 */
export declare type LunchMoneyCryptoConnectionConfig = {
    [key: string]: any;
};
/**
 * Non-serializable injected dependencies for the connection
 */
export declare type LunchMoneyCryptoConnectionContext = {
    [key: string]: any;
};
export interface CryptoBalance {
    asset: string;
    amount: string;
}
export declare const providerNames: readonly ["coinbase", "coinbase_pro", "kraken", "coinbase", "wallet_ethereum"];
export declare type ProviderName = typeof providerNames[number];
export interface LunchMoneyCryptoConnectionBalances {
    providerName: ProviderName;
    balances: CryptoBalance[];
}
export declare type LunchMoneyCryptoConnectionInitialization = LunchMoneyCryptoConnectionBalances;
export interface LunchMoneyCryptoConnection<TConfig extends LunchMoneyCryptoConnectionConfig, TContext extends LunchMoneyCryptoConnectionContext> {
    initiate(config: TConfig, context?: TContext): Promise<LunchMoneyCryptoConnectionInitialization>;
    getBalances(config: TConfig, context?: TContext): Promise<LunchMoneyCryptoConnectionBalances>;
}
