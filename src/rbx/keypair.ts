import CryptoJS from "crypto-js";
import base58 from "bs58";
import EC from "elliptic";
import * as ecc from "tiny-secp256k1";
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';

import { arrayToHex, byteArrayToWordArray, concatArrays, hexStringToByteArray, hexToString, isValidPrivateKey, wordArrayToByteArray, } from "./utils";


export class KeypairService {

    public generatePrivateKey(): string {
        let privateKey: CryptoJS.lib.WordArray;

        do {
            privateKey = CryptoJS.lib.WordArray.random(32);
        } while (!isValidPrivateKey(privateKey));

        return privateKey.toString(CryptoJS.enc.Hex);
    }

    public generateMnemonic(words: 12 | 24 = 12): string {
        return bip39.generateMnemonic(words == 12 ? 128 : 256);
    }

    public privateKeyFromMneumonic(mnemonic: string, nonce: number): string {


        const seed = bip39.mnemonicToSeedSync(mnemonic);

        const bip32 = BIP32Factory(ecc);

        const root = bip32.fromSeed(seed);

        const account = root.derivePath(`m/0'/0'/${nonce}'`);
        if (account.privateKey) {
            return account.privateKey.toString('hex');
        }
        return "";
    }

    public publicFromPrivate(privateKey: string): string {
        const curve = new EC.ec("secp256k1");

        const buffer = Buffer.from(privateKey.toLowerCase(), "hex");
        const keyPair = curve.keyFromPrivate(buffer);
        return keyPair.getPublic("hex");
    }


    public addressFromPrivate(privateKey: string, isTestNet = false): string {

        const curve = new EC.ec("secp256k1");

        const buffer = Buffer.from(privateKey.toLowerCase(), "hex");
        const keyPair = curve.keyFromPrivate(buffer);
        const publicKey = keyPair.getPublic("hex");

        const pubKeySha = CryptoJS.SHA256(hexToString(publicKey));

        const pubKeyShaRipe = CryptoJS.RIPEMD160(pubKeySha);

        const preHashWNetworkData = concatArrays([
            new Uint8Array(isTestNet ? [0x89] : [0x3c]),
            wordArrayToByteArray(pubKeyShaRipe),
        ]);

        const publicHash = CryptoJS.SHA256(byteArrayToWordArray(preHashWNetworkData));

        const publicHashHash = CryptoJS.SHA256(publicHash);

        const checksum = publicHashHash.toString(CryptoJS.enc.Hex).slice(0, 8);

        const address = `${arrayToHex(preHashWNetworkData)}${checksum}`;

        const base54Address = base58.encode(hexStringToByteArray(address));

        return base54Address;
    }

}

export default KeypairService;