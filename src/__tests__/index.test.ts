import { ExplorerService, KeypairService, TransactionService } from '../index';
import { TxOptions, TxType } from '../rbx/transaction';
import { isValidAddress, isValidPrivateKey } from '../rbx/utils';
import CryptoJS from 'crypto-js';

import dotenv from 'dotenv';
dotenv.config({ path: 'test.env' })


describe('test env vars', () => {

  const expectedEnvVars = ['PRIVATE_KEY', 'PUBLIC_KEY', 'FROM_ADDRESS', 'TO_ADDRESS', 'WALLET_ADDRESS'];

  for (const entry of expectedEnvVars) {
    test(`${entry}`, () => {
      const item = process.env[entry];
      expect(item).not.toBe(undefined);
    })
  }

})

describe('generate a private key', () => {

  test('private key should should be valid', () => {
    const keypairService = new KeypairService();
    const privateKey = keypairService.generatePrivateKey();
    const privateKeyWordArray = CryptoJS.enc.Hex.parse(privateKey);
    expect(isValidPrivateKey(privateKeyWordArray)).toBe(true);
  });

});

describe('public key from private key', () => {

  let PRIVATE_KEYS: string[];
  let EXPECTED_PUBLIC_KEYS: string[];

  beforeAll(() => {
    PRIVATE_KEYS = [process.env.PRIVATE_KEY || ""];
    EXPECTED_PUBLIC_KEYS = [process.env.PUBLIC_KEY ?? ""]
  })

  test('private key should generate valid RBX address', () => {
    const keypairService = new KeypairService();

    for (let i = 0; i < PRIVATE_KEYS.length; i++) {

      const privateKey = PRIVATE_KEYS[i];
      const expectedPublicKey = EXPECTED_PUBLIC_KEYS[i];

      const publicKey = keypairService.publicFromPrivate(privateKey);
      expect(publicKey == expectedPublicKey).toBe(true);
    }

  });

});

describe('address from private key', () => {

  let PRIVATE_KEYS: string[];
  let EXPECTED_ADDRESSES: string[];

  beforeAll(() => {
    PRIVATE_KEYS = [process.env.PRIVATE_KEY ?? ""];
    EXPECTED_ADDRESSES = [process.env.FROM_ADDRESS ?? "",]
  })

  test('private key should generate valid RBX address', () => {
    const keypairService = new KeypairService();

    for (let i = 0; i < PRIVATE_KEYS.length; i++) {

      const privateKey = PRIVATE_KEYS[i];
      const expectedAddress = EXPECTED_ADDRESSES[i];

      const address = keypairService.addressFromPrivate(privateKey);
      expect(address == expectedAddress).toBe(true);
    }

  });

});



describe('create private key and generate address', () => {


  test('should result in a valid RBX address', () => {
    const keypairService = new KeypairService();

    const privateKey = keypairService.generatePrivateKey();
    const address = keypairService.addressFromPrivate(privateKey);
    expect(isValidAddress(address)).toBe(true);
  });

});


describe('generate mnemonic phrase', () => {

  test('should result in 12 words', () => {
    const keypairService = new KeypairService();
    const phrase = keypairService.generateMnemonic();
    expect(phrase.split(' ').length).toBe(12);
  });

  test('should result in 24 words', () => {
    const keypairService = new KeypairService();
    const phrase = keypairService.generateMnemonic(24);
    expect(phrase.split(' ').length).toBe(24);
  });

});

describe('generate mnemonic and create private key', () => {

  test('private key should be valid', () => {
    const keypairService = new KeypairService();
    const phrase = keypairService.generateMnemonic();
    const privateKey = keypairService.privateKeyFromMneumonic(phrase, 0);
    const privateKeyWordArray = CryptoJS.enc.Hex.parse(privateKey);
    expect(isValidPrivateKey(privateKeyWordArray)).toBe(true);
  });

  test('address should be valid', () => {
    const keypairService = new KeypairService();
    const phrase = keypairService.generateMnemonic();
    const privateKey = keypairService.privateKeyFromMneumonic(phrase, 0);
    const address = keypairService.addressFromPrivate(privateKey);
    expect(isValidAddress(address)).toBe(true);
  });

});

describe('transaction checks', () => {

  let txService: TransactionService;
  let PRIVATE_KEY: string;

  let txOptions: TxOptions;

  beforeAll(() => {
    jest.setTimeout(30000);

    txService = new TransactionService(process.env.WALLET_ADDRESS || "");
    PRIVATE_KEY = process.env.PRIVATE_KEY || "";

    txOptions = {
      fromAddress: process.env.FROM_ADDRESS || "",
      toAddress: process.env.TO_ADDRESS || "",
      amount: 1.52,
      type: TxType.transfer
    }
  });

  test("transaction", async () => {
    const t = await txService.buildTransaction(txOptions);
    expect(t).toBeTruthy();
  })

  test("sign and send transaction", async () => {

    const t = await txService.buildTransaction(txOptions);
    const hash = t['Hash'];
    expect(hash).toBeTruthy();

    const signature = txService.getSignature(hash, PRIVATE_KEY);

    expect(signature).toBeTruthy();

    const signatureIsValid = await txService.validateTransaction(hash, txOptions.fromAddress, signature);
    expect(signatureIsValid).toBe(true);

    t['Signature'] = signature;

    const testTxHash = await txService.broadcastTransaction(t, true);
    expect(testTxHash).toBeTruthy();

  })

  test("send transaction", async () => {
    const transactionHash = txService.buildAndSendTransaction(txOptions, PRIVATE_KEY, true);
    expect(transactionHash).toBeTruthy();
  })

});

describe('explorer checks', () => {

  let explorerService: ExplorerService;

  beforeAll(() => {
    jest.setTimeout(10000);
    explorerService = new ExplorerService();
  });


  test("latest block", async () => {
    const block = await explorerService.latestBlock();
    expect(block).toBeTruthy();
    expect(block.height).toBeGreaterThan(703789);
  })

  test("5 blocks", async () => {
    const response = await explorerService.blocks(5);
    expect(response.results.length).toBe(5);
  })


  test("address", async () => {
    const address = await explorerService.getAddress(process.env.FROM_ADDRESS || "");
    expect(address).toBeTruthy();
  })


  test("balance", async () => {
    const balance = await explorerService.getBalance(process.env.FROM_ADDRESS || "");
    expect(balance).toBeGreaterThan(0);
  })

});

// describe('ensure mnumonic results in correct private key and address', () => {

//   let MNUMONIC: string;
//   let EXPECTED_PRIVATE_KEY: string;
//   let EXPECTED_ADDRESS: string;

//   beforeAll(() => {
//     MNUMONIC = 'provide fun correct gym swim control reopen nasty jacket window trap action';
//     EXPECTED_PRIVATE_KEY = "2de45504622ea03f740f681f2908cce0d83b988eda6acebeeb23d2c7bc59251e";
//     EXPECTED_ADDRESS = "R9dRdKbCRC2zbecz7gnf5po5Wr8fF2uwtp";
//   })

//   test('private key should generate valid RBX address', () => {
//     const privateKey = keypair.privateKeyFromMneumonic(MNUMONIC, 1);
//     // const privateKeyWordArray = CryptoJS.enc.Hex.parse(privateKey);
//     // expect(isValidPrivateKey(privateKeyWordArray)).toBe(true);

//     expect(privateKey).toBe(EXPECTED_PRIVATE_KEY);
//   });

// });

