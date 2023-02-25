### Open the directory and run the script line:

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

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](issues).

## 📝 License

This project is [MIT](LICENSE) licensed.
