# 🧬 Arcium Blind Auction on Solana

A privacy-preserving, decentralized blind auction platform built on **Solana** and powered by **Arcium MPC**. 

![Arcium Blind Auction UI](/C:/Users/USER/.gemini/antigravity/brain/b0c8d461-c252-498e-8c93-67c07ac72d2c/full_page_localhost_3000_verified_1774449705802.png)

## 🚀 Overview
Arcium Blind Auction allows bidders to participate in high-stakes auctions without revealing their true bid value on-chain. Bidders lock a fixed **50 SOL** deposit as a mask. The actual bid remains **encrypted** throughout the auction duration. At the end of the auction, the **Arcium MPC Network** computes the winner confidentially, revealing only the winner's public key without exposing individual bid amounts.

## 💎 Features
- **Privacy-First Bidding**: Bids are encrypted locally via Arcium SDK before submission.
- **MPC-Driven Resolution**: Winner selection happens inside a Secure MPC circuit, not in public smart contract state.
- **Solana On-Chain Security**: Funds are held in absolute safety within a PDA-controlled Anchor program.
- **Premium UX**: High-fidelity glassmorphic interface with real-time wallet connection and status tracking.

## 🛠️ Tech Stack
- **Blockchain**: Solana (Anchor / Rust)
- **Privacy**: Arcium MPC (Arcium SDK & Custom MPC Circuit)
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Wallet**: @solana/wallet-adapter (Phantom)

## 🏗️ Architecture
1.  **Bidder** encrypts their bid value and submits a `submit_bid` transaction to the **Solana** program.
2.  The bid value is masked on-chain, but the encrypted data is stored in a **Bid Account**.
3.  Upon auction end, an **Arcium Session** is opened.
4.  The **MPC Circuit** fetches encrypted bid data, evaluates the maximum bid confidentially, and returns only the **Winner's Public Key**.
5.  The **Solana Contract** processes the winner, distributes the prize, and refunds the partial deposits based on the evaluated winner.

## ⚙️ How to Run

### 1. Smart Contract (Solana)
```bash
anchor build
anchor deploy
```

### 2. Privacy Circuit (Arcium)
```bash
cd arcium_circuit
arcium build
arcium deploy
```

### 3. Frontend (Next.js)
```bash
cd app
npm install
npm run dev
```

---
**Created by [Uthman(Brillo Digitals)](https://github.com/Brillo-Digitals) | 2026**
