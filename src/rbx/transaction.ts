/* eslint-disable @typescript-eslint/no-explicit-any */
import KeypairService from "./keypair";
import CryptoJS from "crypto-js";
import secp256k1 from 'secp256k1';
import base58 from "bs58";

export enum TxType {
    transfer,
    node,
    nftMint,
    nftTx,
    nftBurn,
    nftSale,
    adnr,
    dstShop,
    voteTopic,
    vote,
}

export type TxOptions = {
    toAddress: string;
    fromAddress: string;
    amount: number;
    type: TxType;
}

export type TxPayload = {
    hash?: string;
    toAddress: string;
    fromAddress: string;
    type: TxType;
    amount: number;
    nonce: number;
    fee?: number;
    timestamp: number;
    signature?: string;
    data?: any;
}


class WalletService {
    walletAddress: string;

    constructor(walletAddress: string) {
        this.walletAddress = walletAddress;
    }

    private get baseUrl() {
        return `${this.walletAddress}/txapi/TXV1`
    }

    private async getJson(path: string): Promise<any> {
        const url = `${this.baseUrl}${path[0] === "/" ? '' : '/'}${path}`;
        const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
        const body = await response.text();
        return JSON.parse(body);
    }

    private async postJson(path: string, payload = {}): Promise<any> {
        const url = `${this.baseUrl}${path[0] === "/" ? '' : '/'}${path}`

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const body = await response.text();
        return JSON.parse(body);

    }

    private getValidatedData(data: any, key: string): any {
        if (data['Result'] == 'Success') {
            return data[key];
        }
        return null;
    }


    public async timestamp(): Promise<any> {
        const data = await this.getJson(`/GetTimeStamp`);
        return this.getValidatedData(data, 'Timestamp');
    }

    public async nonce(address: string): Promise<any> {
        const data = await this.getJson(`/GetAddressNonce/${address}`);
        return this.getValidatedData(data, 'Nonce');
    }


    public async fee(payload: any): Promise<any> {
        const data = await this.postJson(`/GetRawTxFee`, payload);
        return this.getValidatedData(data, 'Fee');
    }

    public async hash(payload: any): Promise<any> {
        const data = await this.postJson(`/GetTxHash`, payload);
        return this.getValidatedData(data, 'Hash');
    }

    public async validateTransaction(message: string, address: string, signature: string): Promise<boolean | null> {
        const url = `/ValidateSignature/${message}/${address}/${signature}`;
        const data = await this.getJson(url);
        return data['Result'] === 'Success';
    }

    public async broadcastTransaction(payload: any, dryRun = false): Promise<string | null> {
        const data = await this.postJson(dryRun ? `/VerifyRawTransaction` : `/SendRawTransaction`, payload);
        if (data['Result'] === "Success" && data['Hash']) {
            return data['Hash'];
        }
        return null;
    }



}


export class TransactionService {

    walletService: WalletService

    constructor(walletAddress: string) {
        this.walletService = new WalletService(walletAddress);
    }


    private handleError(message: string) {
        console.error(message);
        return null;
    }

    public async getTimestamp(): Promise<number | null> {
        return await this.walletService.timestamp();

    }

    public async getNonce(address: string): Promise<number | null> {
        return await this.walletService.nonce(address);
    }

    public async getFee(payload: any): Promise<number | null> {
        return await this.walletService.fee(payload);
    }

    public async getHash(payload: any): Promise<string | null> {
        return await this.walletService.hash(payload);
    }

    public async validateTransaction(hash: string, address: string, signature: string): Promise<boolean | null> {
        return await this.walletService.validateTransaction(hash, address, signature);
    }

    private buildTransactionPayload(options: TxPayload) {
        const { hash, toAddress, fromAddress, type, amount, nonce, fee, timestamp, signature, data } = options;
        return {
            'Hash': hash ?? '',
            'ToAddress': toAddress,
            'FromAddress': fromAddress,
            'TransactionType': type,
            'Amount': amount,
            'Nonce': nonce,
            'Fee': fee ?? 0,
            'Timestamp': timestamp,
            'Signature': signature ?? '',
            'Height': 0,
            'Data': data ?? null
        };
    }



    public async buildTransaction(options: TxOptions): Promise<any> {

        const { fromAddress, toAddress, type, amount } = options;

        const timestamp = await this.getTimestamp();
        if (!timestamp) return this.handleError("Error getting timestamp");

        const nonce = await this.getNonce(options.fromAddress)
        if (nonce === null) return this.handleError("Error getting nonce");

        let payload = this.buildTransactionPayload({
            toAddress: toAddress,
            fromAddress: fromAddress,
            type: type,
            amount: amount,
            timestamp: timestamp,
            nonce: nonce,
        });

        const fee = await this.getFee(payload);
        if (fee === null) return this.handleError("Error getting fee");

        payload = this.buildTransactionPayload({
            toAddress: toAddress,
            fromAddress: fromAddress,
            type: type,
            amount: amount,
            timestamp: timestamp,
            nonce: nonce,
            fee: fee,
        });

        const hash = await this.getHash(payload);
        if (hash === null) return this.handleError("Error getting hash");

        payload = this.buildTransactionPayload({
            toAddress: toAddress,
            fromAddress: fromAddress,
            type: type,
            amount: amount,
            timestamp: timestamp,
            nonce: nonce,
            fee: fee,
            hash: hash,
        });

        return payload;

    }

    public getSignature(message: string, privateKeyHex: string) {
        const data = CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);

        const privateKey = Buffer.from(privateKeyHex, 'hex');
        const dataBuffer = Buffer.from(data, 'hex');

        const { signature } = secp256k1.ecdsaSign(dataBuffer, privateKey);
        const derEncodedSignature = secp256k1.signatureExport(signature);

        const signatureBase64 = Buffer.from(derEncodedSignature).toString('base64');

        const keypairService = new KeypairService();

        let publicKeyHex = keypairService.publicFromPrivate(privateKeyHex);
        if (publicKeyHex.substring(0, 2) === '04') {
            publicKeyHex = publicKeyHex.substring(2);
        }

        const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
        const publicKeyBufferBase58 = base58.encode(publicKeyBuffer);

        const fullSignature = `${signatureBase64}.${publicKeyBufferBase58}`;

        return fullSignature;
    }

    public async broadcastTransaction(payload: any, dryRun = false) {
        return await this.walletService.broadcastTransaction(payload, dryRun);
    }

    public async buildAndSendTransaction(options: TxOptions, privateKey: string, dryRun = false) {
        const t = await this.buildTransaction(options);
        const hash = t['Hash'];
        if (!hash) {
            console.error("Hash error");
            return null;
        }

        const signature = this.getSignature(hash, privateKey);

        if (!signature) {
            console.error("Signature error");
            return null;
        }

        const signatureIsValid = await this.validateTransaction(hash, options.fromAddress, signature);
        if (!signatureIsValid) {
            console.error("Invalid Signature");
            return;
        }

        t['Signature'] = signature;

        const transactionHash = await this.broadcastTransaction(t, dryRun);
        if (!transactionHash) {
            console.error("No transaction hash");
            return;
        }

        return transactionHash;

    }
}


export default TransactionService;