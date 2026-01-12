# 🌐 WeilChain Nexus
> **The Decentralized AI Applet Marketplace on WeilChain**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status: Development](https://img.shields.io/badge/Status-Development-orange)
![Network: Weilliptic Testnet](https://img.shields.io/badge/Network-Weilliptic_Testnet-cyan)
![Tech: Next.js](https://img.shields.io/badge/Tech-Next.js_16-black)

## 🚀 The Vision

**WeilChain Nexus** is a decentralized marketplace for AI applets built on **WeilChain** - the first blockchain with native support for:

- 🧠 **On-Chain AI (MCP)** - Run AI models directly on the blockchain
- 🌐 **HTTP Outcalls** - Make external API calls from smart contracts
- 🎨 **On-Chain Frontend Hosting** - Deploy your entire DApp on-chain
- 🔗 **Cross-Contract Composition** - Chain applets into powerful pipelines

---

## ✨ Key Features

### 🧩 **Applet Marketplace**
Discover and deploy AI-powered micro-services. From **Text Summarizers** to **Sentiment Analyzers**, monetize your code by registering applets as NFTs.

### 🔗 **Visual Pipeline Builder**
No coding required. Drag, drop, and connect applets to build powerful workflows.
- **Input**: Text, Images, CSV data
- **Process**: Chain multiple applets together
- **Output**: Results stored on-chain

### 🪙 **Yutaka Token (YTK) Economy**
Pay for applet executions using fungible tokens. Applet owners earn fees automatically.

### 📜 **Immutable Execution Logs**
Every pipeline run is recorded on-chain. Full transparency and audit trails.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **Blockchain** | WeilChain (Weilliptic Testnet) |
| **Smart Contracts** | Rust + WebAssembly (WASM) |
| **SDK** | @weilliptic/weil-sdk |
| **Wallet** | WAuth (Weilliptic Wallet) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS                                    │
│          (Connect via WAuth - Weilliptic Wallet)               │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Next.js Frontend      │
                    │   (@weilliptic/weil-sdk)  │
                    └─────────────┬─────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
   ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
   │ AppletRegistry  │   │   Marketplace   │   │   Yutaka Token  │
   │   (NFT-based)   │   │   (Payments)    │   │   (Fungible)    │
   └─────────────────┘   └─────────────────┘   └─────────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      AI MCP Applets       │
                    │  (TextSummarizer, etc.)   │
                    └───────────────────────────┘
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- Rust + wasm32-unknown-unknown target (for contract development)
- WAuth Wallet (browser extension)

### Installation

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

## 📦 Smart Contracts

### Build Contracts

```bash
# Navigate to contract directory
cd wadk/applets/rust/fungible_token/yutaka

# Build to WASM
cargo build --release --target wasm32-unknown-unknown
```

### Deploy Contracts

```bash
# Using wadk CLI
wadk deploy --manifest manifest.json

# Or via unweil.me web interface
# Upload: yutaka.wasm + yutaka.widl
```

### Contract Structure

```
applets/
├── nexus_token/          # NexusToken (NXS) - Payment token
├── applet_registry/      # NFT registry for applets
├── marketplace/          # Payment & execution orchestration
├── ai/
│   └── text_summarizer/  # MCP-enabled AI applet
└── deploy_yutaka/        # Ready-to-deploy Yutaka token
```

---

## 🔧 Environment Variables

Create `.env.local`:

```env
# WeilChain Contract Addresses (after deployment)
NEXT_PUBLIC_WEIL_TOKEN_ADDRESS=
NEXT_PUBLIC_WEIL_REGISTRY_ADDRESS=
NEXT_PUBLIC_WEIL_MARKETPLACE_ADDRESS=

# WeilChain Network
NEXT_PUBLIC_WEIL_NETWORK=testnet
NEXT_PUBLIC_WEIL_ENDPOINT=https://sentinel.unweil.me
```

---

## 🗂️ Project Structure

```
weilchain-nexus/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── context/          # WeilProvider, MockDataContext
│   └── hooks/            # Custom hooks (useYutakaToken, etc.)
├── applets/              # Smart contracts (Rust/WASM)
├── wadk/                 # WeilChain Applet Dev Kit (submodule)
└── public/               # Static assets
```

---

## 🏆 EIBS 2.0 Competition

This project is built for the **EIBS 2.0 Blockchain Competition**, showcasing:

1. ✅ **Native WeilChain Integration** - Built on Weilliptic testnet
2. ✅ **On-Chain AI (MCP)** - Text summarization via HTTP outcalls
3. ✅ **Cross-Contract Composition** - Pipeline execution
4. ✅ **Token Economy** - Yutaka-based payment system
5. ✅ **NFT Applets** - Applets as tradeable assets

---

## 🔐 Security

| Component | Approach |
|-----------|----------|
| User Wallets | Users connect WAuth - no keys stored |
| Contract Deployment | Via wadk CLI or unweil.me |
| Transactions | Signed by user's wallet in real-time |

---

## 📚 Resources

- [WeilChain Documentation](https://docs.unweil.me)
- [Weil SDK on npm](https://www.npmjs.com/package/@weilliptic/weil-sdk)
- [wadk GitHub](https://github.com/weilliptic-public/wadk)
- [unweil.me Explorer](https://unweil.me)

---

<p align="center">
  Made with ❤️ by <strong>Abra Code Abra</strong> for EIBS 2.0
</p>
