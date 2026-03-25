# Decentralized Blind Auction on Solana with Arcium

Welcome to the **Arcium Blind Auction** project. This document outlines the architecture, step-by-step implementation, security considerations, and deployment guide for a privacy-preserving auction application on Solana.

---

## 1. Full Project Architecture

**Core Concept:** A blind auction where bidders submit encrypted bids. The highest bid wins, but no party (not even the smart contract) knows any bid amounts until the auction calculation is completed using an MPC network (Arcium).

### Architecture Components:
1. **Solana Smart Contract (Anchor):**
   - Manages auction state (item details, duration, end time).
   - Receives and stores encrypted bids.
   - Handles the financial locks (Bidders must deposit a fixed upper-bound amount of SOL/USDC to hide their actual bid, or use Confidential Transfers).
   - Verifies the computation result posted by the Arcium node network.
   - Handles the payout (item to the winner, refund to the losers, payment to the seller).

2. **Arcium MPC Network:**
   - **Encryption:** Frontend encrypts the user's bid amount using an Arcium public key tied to the auction session.
   - **Computation Circuit:** A Rust-based MPC circuit that takes all encrypted bids, evaluates `max(bids)`, and returns the index/pubkey of the winner and the winning bid amount.
   - **Trigger:** A relayer or crank service triggers the Arcium network when the auction's timestamp expires. The network submits a transaction back to Solana with the decrypted winner data.

3. **Frontend Application (Next.js + TypeScript):**
   - **UI:** Integrates with `@solana/wallet-adapter-react`.
   - **Arcium SDK:** Encrypts user bids locally in the browser before submitting the Anchor transaction.
   - **State Queries:** Fetches the auction state and displays the winner once computation is complete.

---

## 2. Step-by-Step Implementation Plan

### Phase 1: Smart Contract Setup
1. Init Anchor project (`anchor init blind_auction`).
2. Build `Auction` account struct (holding end_time, seller, min_price, status).
3. Build `Bid` account struct (address, encrypted_bid tuple, deposit_amount).
4. Implement `initialize_auction`, `submit_bid`, `trigger_computation`, and `settle_auction` instructions.

### Phase 2: Arcium Circuit Implementation
1. Write an MPC circuit using Arcium's compute SDK (Rust based).
2. The circuit expects an array of encrypted `u64` values.
3. The circuit outputs the index of the highest value and the value itself.
4. Deploy the circuit logic to the Arcium network.

### Phase 3: Frontend Setup
1. Create a Next.js app using `npx create-next-app`.
2. Install Solana wallet adapter and Anchor client.
3. Install Arcium SDK.
4. Build `CreateAuction` and `SubmitBid` components.
5. In `SubmitBid`, fetch the Arcium public key, encrypt the bid, create the transaction instruction, and send it.

### Phase 4: Integration & Testing
1. Use a local validator or Devnet.
2. Deploy the Anchor program.
3. Simulate multiple encrypted bids.
4. Simulate the Arcium execution (or use their devnet).

---

## 3. GitHub Repo Structure
```text
blind_auction/
├── Anchor.toml
├── Cargo.toml
├── programs/
│   └── blind_auction/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── state.rs
│           ├── error.rs
│           └── instructions/
├── arcium_circuit/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── app/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── AuctionCard.tsx
│   │   │   └── BidForm.tsx
│   │   └── utils/
│   │       ├── anchorClient.ts
│   │       └── arciumIntegration.ts
└── tests/
    └── blind_auction.ts
```

---

## 4. Security Considerations

1. **Information Leakage via Deposits:** 
   - **Problem:** If a user deposits exactly the amount they bid in SOL, it's not a blind auction; the bid is visible on-chain.
   - **Solution:** Force all bidders to deposit a flat "maximum ceiling" (e.g., 50 SOL) to participate, or use Solana Token-2022 Confidential Transfers to hide the deposit amount. Excess funds are refunded upon settlement.

2. **MEV & Front-Running:**
   - **Problem:** Searchers might see an encrypted bid and try to extract value.
   - **Solution:** Since bids are encrypted client-side, searchers cannot know the bid amount. Front-running the *submission* of an encrypted bid offers no economic advantage to the attacker, mitigating MEV.

3. **Replay Attacks:**
   - **Problem:** An attacker might copy someone else's encrypted bid and submit it as their own.
   - **Solution:** The encryption scheme MUST include the bidder's Public Key and the Auction ID as salts/nonces before encryption. If the Arcium circuit decrypts a bid from User B but the embedded salt says User A, it invalidates the bid.

4. **Malicious Seller or Non-Closing Auctions:**
   - **Problem:** The auction ends but is never computed.
   - **Solution:** Allow any user (a crank) to trigger the Arcium computation. Allow bidders to withdraw/cancel their bids if computation hasn't occurred X slots after the end time.

---

## 5. Deployment Guide (Solana Devnet)

1. **Configure Solana CLI:**
   ```bash
   solana config set --url devnet
   solana airdrop 2
   ```
2. **Build and Deploy the Contract:**
   ```bash
   anchor build
   anchor deploy --provider.cluster devnet
   # Copy the returned Program ID and update in your lib.rs and Anchor.toml
   anchor build && anchor deploy
   ```
3. **Deploy the Arcium Circuit:**
   - Use the Arcium CLI: `arcium deploy ./arcium_circuit/target/wasm32-unknown-unknown/release/circuit.wasm`
   - Note the resulting `Circuit ID`.
4. **Configure Frontend:**
   - Set `.env` variable `NEXT_PUBLIC_PROGRAM_ID=<Your_Program_ID>`.
   - Set `.env` variable `NEXT_PUBLIC_ARCIUM_CIRCUIT_ID=<Your_Circuit_ID>`.
5. **Run the Frontend:**
   ```bash
   cd app && npm install && npm run dev
   ```

---

## 6. Bonus Ideas
- **Dynamic Time Extensions:** If an encrypted bid is received in the last 5 minutes, extend the auction by 10 minutes (anti-sniping). This is easy since we just track block timestamps regardless of bid contents.
- **NFT Auctions:** Link the auction to an SPL token vault so that the item (NFT) is automatically transferred to the winner to remove counterparty risk.
- **DAO Governance:** The core auction parameters (min deposit, fee) could be controlled by a DAO with a multi-sig.
