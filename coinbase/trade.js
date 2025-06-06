"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trade = void 0;
const decimal_js_1 = require("decimal.js");
const coinbase_1 = require("./coinbase");
const errors_1 = require("./errors");
const transaction_1 = require("./transaction");
const utils_1 = require("./utils");
/**
 * A representation of a Trade, which trades an amount of an Asset to another Asset on a Network.
 * The fee is assumed to be paid in the native Asset of the Network.
 */
class Trade {
    /**
     * Trades should be created through Wallet.trade or Address.trade.
     *
     * @class
     * @param model - The underlying Trade object.
     * @throws {Error} - If the Trade model is empty.
     */
    constructor(model) {
        if (!model) {
            throw new Error("Trade model cannot be empty");
        }
        this.model = model;
    }
    /**
     * Returns the Trade ID.
     *
     * @returns The Trade ID.
     */
    getId() {
        return this.model.trade_id;
    }
    /**
     * Returns the Network ID of the Trade.
     *
     * @returns The Network ID.
     */
    getNetworkId() {
        return this.model.network_id;
    }
    /**
     * Returns the Wallet ID of the Trade.
     *
     * @returns The Wallet ID.
     */
    getWalletId() {
        return this.model.wallet_id;
    }
    /**
     * Returns the Address ID of the Trade.
     *
     * @returns The Address ID.
     */
    getAddressId() {
        return this.model.address_id;
    }
    /**
     * Returns the From Asset ID of the Trade.
     *
     * @returns The From Asset ID.
     */
    getFromAssetId() {
        return this.model.from_asset.asset_id;
    }
    /**
     * Returns the amount of the from asset for the Trade.
     *
     * @returns The amount of the from asset.
     */
    getFromAmount() {
        const amount = new decimal_js_1.Decimal(this.model.from_amount);
        return amount.div(decimal_js_1.Decimal.pow(10, this.model.from_asset.decimals));
    }
    /**
     * Returns the To Asset ID of the Trade.
     *
     * @returns The To Asset ID.
     */
    getToAssetId() {
        return this.model.to_asset.asset_id;
    }
    /**
     * Returns the amount of the to asset for the Trade.
     *
     * @returns The amount of the to asset.
     */
    getToAmount() {
        const amount = new decimal_js_1.Decimal(this.model.to_amount);
        return amount.div(decimal_js_1.Decimal.pow(10, this.model.to_asset.decimals));
    }
    /**
     * Returns the Trade transaction.
     *
     * @returns The Trade transaction.
     */
    getTransaction() {
        this.transaction = new transaction_1.Transaction(this.model.transaction);
        return this.transaction;
    }
    /**
     * Returns the approve transaction if it exists.
     *
     * @returns The approve transaction.
     */
    getApproveTransaction() {
        if (!this.approveTransaction && this.model.approve_transaction) {
            this.approveTransaction = new transaction_1.Transaction(this.model.approve_transaction);
        }
        return this.approveTransaction;
    }
    /**
     * Signs the Trade with the provided key.
     * This signs the transfer transaction and will sign the approval transaction if present.
     *
     * @param key - The key to sign the Transfer with
     */
    async sign(key) {
        if (this.getApproveTransaction()) {
            await this.getApproveTransaction().sign(key);
        }
        await this.getTransaction().sign(key);
    }
    /**
     * Broadcasts the Trade to the Network.
     *
     * @returns The Trade object
     * @throws {APIError} if the API request to broadcast a Trade fails.
     */
    async broadcast() {
        const tx = this.getTransaction();
        const approveTx = this.getApproveTransaction();
        if (!tx.isSigned()) {
            throw new errors_1.NotSignedError("Cannot broadcast Trade with unsigned transaction");
        }
        if (approveTx && !approveTx.isSigned()) {
            throw new errors_1.NotSignedError("Cannot broadcast Trade with unsigned approve transaction");
        }
        const response = await coinbase_1.Coinbase.apiClients.trade.broadcastTrade(this.getWalletId(), tx.fromAddressId(), this.getId(), {
            signed_payload: tx.getSignature(),
            approve_transaction_signed_payload: approveTx ? approveTx.getSignature() : undefined,
        });
        this.resetModel(response.data);
        return this;
    }
    /**
     * Returns the status of the Trade.
     *
     * @returns The status.
     */
    getStatus() {
        return this.getTransaction()?.getStatus();
    }
    /**
     * Waits until the Trade is completed or failed by polling the Network at the given interval.
     * Raises an error if the Trade takes longer than the given timeout.
     *
     * @param options - The options to configure the wait function.
     * @param options.intervalSeconds - The interval at which to poll the Network, in seconds
     * @param options.timeoutSeconds - The maximum amount of time to wait for the Trade to complete, in seconds
     * @throws {Error} If the Trade takes longer than the given timeout.
     * @throws {APIError} If the request fails.
     * @returns The completed Trade object.
     */
    async wait({ intervalSeconds = 0.2, timeoutSeconds = 10 } = {}) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutSeconds * 1000) {
            await this.reload();
            if (this.getTransaction().isTerminalState()) {
                return this;
            }
            await (0, utils_1.delay)(intervalSeconds);
        }
        throw new errors_1.TimeoutError("Trade timed out");
    }
    /**
     * Reloads the Trade model with the latest version from the server side.
     *
     * @returns The most recent version of Trade from the server.
     */
    async reload() {
        const result = await coinbase_1.Coinbase.apiClients.trade.getTrade(this.getWalletId(), this.getAddressId(), this.getId());
        return this.resetModel(result?.data);
    }
    /**
     * Returns a String representation of the Trade.
     *
     * @returns A String representation of the Trade.
     */
    toString() {
        return (`Trade { transfer_id: '${this.getId()}', network_id: '${this.getNetworkId()}', ` +
            `address_id: '${this.getAddressId()}', from_asset_id: '${this.getFromAssetId()}', ` +
            `to_asset_id: '${this.getToAssetId()}', from_amount: '${this.getFromAmount()}', ` +
            `to_amount: '${this.getToAmount()}', status: '${this.getStatus()}' }`);
    }
    /**
     * Resets the trade model with the specified data from the server.
     *
     * @param model - The Trade model
     * @returns The updated Trade object
     */
    resetModel(model) {
        this.model = model;
        this.transaction = new transaction_1.Transaction(this.model.transaction);
        this.approveTransaction = this.model.approve_transaction
            ? new transaction_1.Transaction(this.model.approve_transaction)
            : undefined;
        return this;
    }
}
exports.Trade = Trade;
