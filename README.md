# 🌐 WeilChain Nexus - Decentralized AI Applet Marketplace

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status: Production](https://img.shields.io/badge/Status-Production-green)
![Network: Weilliptic Testnet](https://img.shields.io/badge/Network-Weilliptic_Testnet-cyan)
![Tech: Next.js 16](https://img.shields.io/badge/Tech-Next.js_16-black)
![Node: >=18](https://img.shields.io/badge/Node.js->=18-brightgreen)

## Table of Contents

1. [Vision & Overview](#vision--overview)
2. [Core Features](#core-features)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [Configuration](#configuration)
7. [Development Guide](#development-guide)
8. [Smart Contract Integration](#smart-contract-integration)
9. [API Documentation](#api-documentation)
10. [Deployment](#deployment)
11. [Contributing](#contributing)
12. [Troubleshooting](#troubleshooting)

---

## Vision & Overview

**WeilChain Nexus** is the flagship decentralized marketplace for AI-powered applets built on **WeilChain** - a next-generation blockchain platform providing native infrastructure for:

- **🧠 On-Chain AI Execution (MCP)** - Execute AI models directly within smart contracts with verifiable outputs
- **🌐 HTTP Outcalls** - Make authenticated external API calls from on-chain code to integrate real-world data
- **🎨 On-Chain Frontend Hosting** - Store and serve entire frontend applications on-chain with IPFS integration
- **🔗 Cross-Contract Composition** - Compose multiple applets into complex, auditable pipelines
- **🔐 Zero-Knowledge Proofs** - Generate cryptographic proofs of execution with full transparency

### Mission

Enable developers to monetize AI services in a trustless, decentralized manner while providing enterprises with verifiable, immutable execution guarantees for mission-critical AI workloads.

---

## Core Features

### 🧩 Intelligent Applet Marketplace

- **Discover & Deploy**: Browse a curated repository of pre-built AI applets
- **Monetization**: Register applets as NFTs with automatic royalty distribution
- **Version Management**: Track applet versions with immutable deployment history
- **Usage Analytics**: Real-time metrics on applet usage and earnings

**Available Applet Categories:**
- Text Processing (Sentiment Analysis, Summarization, Entity Extraction)
- Data Validation & Transformation
- Cryptographic Operations (Hash Generation, Signature Verification)
- Image Processing & Analysis
- Custom AI Models (BERT, GPT-compatible endpoints)

### 🎨 Visual Pipeline Builder

Build complex AI workflows without writing code:

```
[Input Data] 
    ↓
[Sentiment Analyzer] 
    ↓
[Text Summarizer] 
    ↓
[Data Validator] 
    ↓
[Storage/Output]
```

**Features:**
- Drag-and-drop composition interface
- Real-time pipeline validation
- Input/output type checking
- Parameter configuration UI
- Execution history with detailed logs

### 🪙 Yutaka Token (YTK) Economy

- **Fungible Token Standard**: ERC-20 compatible token for payment settlement
- **Gas-less Transactions**: Meta-transactions support for improved UX
- **Staking Rewards**: Lock tokens for applet ecosystem participation
- **Revenue Sharing**: Automatic fee distribution to applet creators
- **Fee Structure**: Configurable per-applet pricing model

### 📊 Execution Transparency

- **Immutable Logs**: Every pipeline execution recorded on-chain
- **Audit Trail**: Complete transaction history with cryptographic proofs
- **Cost Attribution**: Detailed breakdown of token usage per applet
- **Performance Metrics**: Latency, success rate, and verification status
- **Compliance Ready**: GDPR-compatible data retention policies

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     END USERS                               │
│               (Browser/Wallet Connection)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   Next.js 16 Frontend   │
        │  - React 19 Components  │
        │  - Framer Motion        │
        │  - Tailwind CSS         │
        └────────┬────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼──┐    ┌───▼──┐    ┌───▼──┐
│Wagmi │    │Viem  │    │Weil  │
│      │    │      │    │SDK   │
└───┬──┘    └───┬──┘    └───┬──┘
    │           │           │
    └───────────┼───────────┘
                │
    ┌───────────▼───────────┐
    │  WeilChain Testnet    │
    │  (JSON-RPC Provider)  │
    └───────────┬───────────┘
                │
    ┌───────────┴───────────┬──────────────┬──────────────┐
    │                       │              │              │
┌───▼──────────┐  ┌────────▼──────┐  ┌───▼──────┐  ┌───▼──────┐
│AppletRegistry│  │  Marketplace  │  │ YTokens  │  │ ExecutionLogger
│   (NFTs)     │  │  (Payments)   │  │(ERC-20)  │  │ (Logs)
└───┬──────────┘  └────────┬──────┘  └───┬──────┘  └───┬──────┘
    │                      │             │              │
    └──────────────────────┼─────────────┼──────────────┘
                           │
                   ┌───────▼────────┐
                   │  AI Applets    │
                   │  (WASM/MCP)    │
                   └────────────────┘
```

### Component Hierarchy

```
App Layout
├── RootLayout
│   ├── WeilProvider (Web3 Context)
│   ├── MockDataProvider (Test Data)
│   └── Children
├── Pages
│   ├── Home (Marketing)
│   ├── Marketplace (Applet Discovery)
│   ├── Pipeline (Builder UI)
│   └── History (Execution Logs)
└── Components
    ├── Navbar (Navigation)
    ├── AppletCard (Display)
    ├── PipelineBuilder (Canvas)
    ├── Modals (Deploy, Execute, Register)
    └── TokenBalance (Account)
```

### Data Flow

```
User Action
   ↓
React Component (State Update)
   ↓
Wagmi/Viem (Contract Call Construction)
   ↓
WeilChain RPC Endpoint
   ↓
Smart Contract Execution
   ↓
Event Emission
   ↓
Frontend Listener (Updates UI)
   ↓
Database/IPFS Storage
```

---

## Technology Stack

### Frontend Layer

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 16.1.1 | Server-side rendering, API routes |
| **UI Library** | React | 19.2.3 | Component-based UI |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Animation** | Framer Motion | 12.23.26 | Smooth, performance-optimized animations |
| **Type Checking** | TypeScript | 5.x | Static type safety |
| **State Management** | React Context | Built-in | Global state for wallet/data |
| **HTTP Client** | Fetch API | Native | Lightweight HTTP requests |

### Blockchain Integration

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Wallet Connection** | Wagmi | 3.1.3 | React hooks for wallet interaction |
| **Contract Interaction** | Viem | 2.43.3 | Type-safe contract calls |
| **SDK** | @weilliptic/weil-sdk | 1.0.1 | WeilChain-specific utilities |
| **Provider** | WeilChain RPC | Latest | Blockchain node communication |
| **Signer** | WAuth Wallet | Extension | User transaction signing |

### Smart Contracts

| Component | Language | Format | Purpose |
|-----------|----------|--------|---------|
| **Applet Registry** | Rust | WASM (wasm32-unknown-unknown) | Store applet metadata & NFTs |
| **Marketplace** | Rust | WASM | Handle payments & listings |
| **Tokens** | Rust | WASM | YTK token logic |
| **Logger** | Rust | WASM | Immutable execution records |

### Infrastructure & Services

| Service | Provider | Purpose |
|---------|----------|---------|
| **File Storage** | IPFS/Filebase | Decentralized file hosting |
| **Database** | Optional (AWS S3) | Metadata persistence |
| **CDN** | Vercel/Cloudflare | Edge caching for images |
| **AI Models** | Custom Endpoints | Applet execution backend |
| **DNS** | Custom Domain | Application access |

---

## Installation & Setup

### Prerequisites

```bash
# Minimum Requirements
- Node.js >= 18.17.0 (LTS recommended)
- npm >= 9.0.0 or yarn >= 3.0.0
- Git >= 2.40
- 4GB RAM minimum
- 2GB disk space
```

### Step 1: Clone Repository

```bash
# Using HTTPS
git clone https://github.com/haashid/weilchain-nexus.git
cd weilchain-nexus

# Using SSH (if configured)
git clone git@github.com:haashid/weilchain-nexus.git
cd weilchain-nexus
```

### Step 2: Install Dependencies

```bash
# Using npm (recommended)
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

### Step 3: Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Copy example configuration
cp ENV.example .env.local
```

Edit `.env.local` with your configuration:

```env
# ============ Network Configuration ============
NEXT_PUBLIC_WEIL_RPC_URL=https://testnet-rpc.weilliptic.network
NEXT_PUBLIC_WEIL_CHAIN_ID=10001
NEXT_PUBLIC_NETWORK_NAME=Weilliptic_Testnet

# ============ Smart Contract Addresses ============
NEXT_PUBLIC_APPLET_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_YUTAKA_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_EXECUTION_LOGGER_ADDRESS=0x...

# ============ External Services ============
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com

# ============ AWS Configuration (Optional) ============
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=weilchain-nexus-files

# ============ Development (Local Only) ============
NODE_ENV=development
NEXT_PUBLIC_DEBUG_MODE=true
```

### Step 4: Start Development Server

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start

# Build output
npm run build   # Generates .next/ directory
```

The application will be available at `http://localhost:3000`

---

## Configuration

### Tailwind CSS Configuration

The project uses Tailwind CSS 4 with custom theme extensions in `tailwind.config.js`.

### Next.js Configuration

Key settings in `next.config.ts` for optimal performance and compatibility.

### TypeScript Configuration

Strict type checking enabled in `tsconfig.json` with path aliases.

---

## Development Guide

### Project Structure

```
weilchain-nexus/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   ├── marketplace/          # Marketplace page
│   │   ├── pipeline/             # Pipeline builder
│   │   ├── history/              # Execution history
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   ├── context/                  # React Context
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utilities
│   └── services/                 # External services
├── contracts/                    # Smart contracts
├── applets/                      # WASM applets
├── scripts/                      # Deployment scripts
├── public/                       # Static assets
└── README.md                     # This file
```

### Code Style Guidelines

- Use TypeScript with strict mode enabled
- Follow ESLint and Prettier formatting
- Component names in PascalCase
- Utility functions in camelCase
- Constants in UPPER_SNAKE_CASE

---

## Smart Contract Integration

### Contract Overview

- **AppletRegistry.sol** - NFT-based applet metadata storage
- **MarketPlace.sol** - Payment and execution handling
- **YutakaToken.sol** - ERC-20 compatible fungible token
- **ExecutionLogger.sol** - Immutable transaction logging

### Contract Interaction Pattern

```typescript
// Read contract data
const registry = useContractRead({
  address: REGISTRY_ADDRESS,
  abi: REGISTRY_ABI,
  functionName: 'getAppletMetadata',
  args: [tokenId],
});

// Execute contract function
const { write: executeApplet } = useContractWrite({
  address: MARKETPLACE_ADDRESS,
  abi: MARKETPLACE_ABI,
  functionName: 'executeApplet',
});
```

---

## API Documentation

### REST API Endpoints

#### Deploy Applet

```http
POST /api/deploy
Content-Type: application/json
```

#### Upload to IPFS

```http
POST /api/upload-ipfs
Content-Type: multipart/form-data
```

---

## Deployment

### Local Testing

```bash
npm run dev
```

### Production Deployment

```bash
npm run build
npm run start

# Or deploy to Vercel
git push origin main
```

---

## Contributing

### Contributing Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes following code style guidelines
4. Commit with conventional commits: `git commit -m "feat: description"`
5. Push and create a pull request

### Reporting Issues

Create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details

---

## Troubleshooting

### Common Issues

**Scrolling Issues**
- Fixed in latest version with smooth scroll and custom scrollbars
- Clear browser cache if experiencing issues
- Check DevTools for JavaScript errors

**Wallet Connection**
- Ensure WAuth extension is installed
- Verify network is set to Weilliptic Testnet
- Clear browser storage and refresh

**Contract Failures**
- Verify contract addresses in .env.local
- Check account balance
- Review contract ABI matches version
- Examine transaction error logs

**Build Errors**
- Clear .next directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version >= 18

---

## Resources

- [WeilChain Documentation](https://docs.weilliptic.network)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Wagmi Documentation](https://wagmi.sh)

---

## License

MIT License - see LICENSE file for details.

---

## Contact & Support

- **GitHub**: https://github.com/haashid/weilchain-nexus
- **Discord**: [WeilChain Community](https://discord.gg/weilchain)
- **Twitter**: [@weilchain](https://twitter.com/weilchain)

---

**Last Updated**: March 31, 2026
**Repository**: https://github.com/haashid/weilchain-nexus
**Live Demo**: https://weilchain-nexus.vercel.app
