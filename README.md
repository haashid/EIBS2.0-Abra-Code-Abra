# 🌐 WeilChain Nexus
> **The Future of Composable Decentralized Intelligence**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status: Production](https://img.shields.io/badge/Status-Production-green)
![Network: Sepolia](https://img.shields.io/badge/Network-Sepolia-purple)
![Tech: Next.js](https://img.shields.io/badge/Tech-Next.js-black)

## 🚀 The Vision
**WeilChain Nexus** is not just a marketplace; it's an **execution layer for the decentralized web**. By bridging on-chain logic with off-chain computation, we enable users to build complex, verifiable workflows—**Pipelines**—that combine AI, data processing, and financial transactions into a single, seamless experience.

Traditional DApps are siloed. Nexus is **composable**. 
Imagine taking a *Sentiment Analysis Applet*, piping its output into an *Automated Trading Bot*, and logging the result forever on the blockchain. **That is Nexus.**

---

## ✨ Key Features

### 🧩 **Applet Marketplace**
Discover a growing ecosystem of micro-services. From **AI Summarizers** to **Data Sanitizers**, finding the right tool is just a search away. Developers can monetize their code by registering applets directly on-chain.

### 🔗 **Visual Pipeline Builder**
No coding required. Drag, drop, and connect applets to build powerful workflows.
*   **Input**: Text, Images, CSVs.
*   **Process**: Chain multiple applets logic together.
*   **Output**: Actionable insights logged immutably.

### 🤖 **AI-Powered Integrations**
Nexus ships with built-in AI capabilities. Run **Sentiment Analysis** and **Text Summarization** locally in the browser, verifiable by the community.

### 📜 **Immutable Execution Logs**
Every pipeline run is recorded on the blockchain. Trust, but verify. We provide a transparent audit trail of every computation, ensuring accountability in a decentralized world.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion
*   **Blockchain**: Ethereum Sepolia Testnet, Solidity 0.8.19
*   **Tooling**: Hardhat, Wagmi v3, Viem
*   **AI Engine**: Sentiment.js, Hugging Face (optional)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS                                    │
│     (Connect via MetaMask/WalletConnect - NO KEYS REQUIRED)     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Next.js Frontend      │
                    │   (Wagmi + Viem Hooks)    │
                    └─────────────┬─────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
   ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
   │ AppletRegistry  │   │ ExecutionLogger │   │   AI Services   │
   │   (Solidity)    │   │   (Solidity)    │   │   (Browser)     │
   └─────────────────┘   └─────────────────┘   └─────────────────┘
```

**Key Point**: All user interactions use their **connected wallet** dynamically. No private keys are ever hardcoded or stored.

---

## ⚡ Getting Started

### For Users (No Setup Required!)
1. Visit the deployed app
2. Connect your wallet (MetaMask, Rainbow, etc.)
3. Start exploring applets and building pipelines!

### For Developers

#### Prerequisites
*   Node.js (v18+)
*   A Web3 wallet with Sepolia testnet ETH

#### Installation

```bash
# Clone the Repository
git clone https://github.com/haashid/EIBS2.0-Abra-Code-Abra.git
cd weilchain-nexus

# Install Dependencies
npm install

# Run Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Deployment Guide (For Administrators Only)

> **Note**: This section is for deploying the smart contracts. Regular users don't need this.

### 1. Contract Deployment

Create a `.env` file (this is gitignored and NEVER committed):

```env
# ADMIN ONLY - For deploying contracts
PRIVATE_KEY=your_deployer_wallet_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=optional_for_verification
```

Deploy:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
```

### 2. Configure Frontend

After deployment, update your `.env.local`:
```env
NEXT_PUBLIC_REGISTRY_ADDRESS=0x_deployed_registry_address
NEXT_PUBLIC_EXECUTION_ADDRESS=0x_deployed_logger_address
NEXT_PUBLIC_CHAIN_ID=11155111
```

### 3. Build & Deploy Frontend
```bash
npm run build
# Deploy to Vercel, Netlify, or your preferred host
```

---

## 🔐 Security Model

| Component | Security Approach |
|-----------|-------------------|
| User Wallets | Users connect their OWN wallets - no keys stored |
| Contract Deployment | One-time admin action with secure key management |
| Transactions | Signed by user's wallet in real-time |
| Private Keys | NEVER hardcoded, NEVER stored, NEVER transmitted |

---

## 🏆 Innovation & Impact

WeilChain Nexus solves the **fragmentation problem** in Web3. By standardizing input/output schemas for applets, we allow disparate tools to talk to each other. This opens the door for:
*   **Automated DAO Governance** based on social sentiment.
*   **Decentralized content moderation** pipelines.
*   **Trustless financial reporting** from raw data input.

**Built for Production. Ready for Scale.**

---

<p align="center">
  Made with ❤️ by Abra Code Abra
</p>
