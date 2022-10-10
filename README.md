# KrelFunding Dapp

## Description

This is a very simple crowdfunding dapp where users can:

- See projects hosted on the Celo Blockchain
- Donate cUSD to the selected project
- Add your own project to the dapp
- Withdraw cUSD when the goal is reached

## Live Demo

[KrelFunding Dapp](https://krel-developer.github.io/)

## Usage

### Requirements

1. Install the [CeloExtensionWallet](https://chrome.google.com/webstore/detail/celoextensionwallet/kkilomkmpmkbdnfelcpgckmpcaemjcdh?hl=en) from the Google Chrome Store.
2. Create a wallet.
3. Go to [https://celo.org/developers/faucet](https://celo.org/developers/faucet) and get tokens for the alfajores testnet.
4. Switch to the alfajores testnet in the CeloExtensionWallet.

### Test

1. Create a project.
2. Create a second account in your extension wallet and send them cUSD tokens.
3. Donate to project with secondary account (donate less then goal).
4. Try Withdraw cUSD with first account.
5. Donate to project with secondary account (donate the missing part or more).
6. Withdraw cUSD with first account.
7. Check if balance of first account increased.
8. Try Withdraw cUSD with first account.

## Project Setup

### Install

```
npm install
```

### Start

```
npm run dev
```

### Build

```
npm run build
```
