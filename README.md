# RBX JS SDK

This SDK allows for integrating with the RBX platform through javascript & typescript via node or a browser.
Although yarn is used here, npm can be use instead. Simply replace `yarn build:node` with `npm run build:node` as an example.

#### Install Packages

```bash
yarn
```

#### Testing

Create a `test.env` file in the root directory and include the following entries:

```bash
PRIVATE_KEY=""
PUBLIC_KEY=""
FROM_ADDRESS=""
TO_ADDRESS=""
WALLET_ADDRESS=""
```

> Note: keys can be generated without a wallet. To broadcast transactions, you must have a wallet running. It does not need to have any keys/balance associated with it (and shouldn't for security purposes) but needs to be syned to block height in order to validate transactions correctly. It is recommended you proxy this wallet with a server in the middle.

Then run:

```bash
yarn test
```

#### build for node

```bash
yarn build:node
```

#### build for browser

```bash
yarn build:browser
```

This will create a file called `lib/browser.js` which can be included in your project.
See `example/vanilla-example/index.html` for a basic integration example.

> Note: this command will also copy the file to the example folder.

#### Cipher base fix

You may encounter an error building to the browser due to cipher-base. Open this file:
`node_modules/cipher-base/index.js`

And replace the imports with the following:

```
var Buffer = require('safe-buffer').Buffer
var Transform = require('readable-stream').Transform // replacing instead of "stream"
var StringDecoder = require('string_decoder').StringDecoder
var inherits = require('inherits')
```

> Note: this is automated by the postinstall script but it may be something you run into.

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](issues).

## 📝 License

This project is [MIT](LICENSE) licensed.
