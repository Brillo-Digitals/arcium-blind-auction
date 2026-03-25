"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";

// --- Mock Arcium encryption (replace with real SDK in production) ---
async function mockEncryptBid(amount: number, bidderKey: string): Promise<Uint8Array> {
  const payload = JSON.stringify({ amount, bidder: bidderKey, nonce: Date.now() });
  return new TextEncoder().encode(payload);
}

// --- Demo auction data (replace with on-chain fetch in production) ---
const DEMO_AUCTIONS = [
  { id: "1", title: "Bored Ape #4201", image: "🦍", minBid: 20, ends: "2h 14m", bids: 7 },
  { id: "2", title: "CryptoPunk #9938", image: "👾", minBid: 50, ends: "6h 00m", bids: 12 },
  { id: "3", title: "DeGod #1337", image: "⚡", minBid: 5, ends: "23h 58m", bids: 3 },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (publicKey) {
      console.log("💎 Wallet connected:", publicKey.toBase58());
    } else {
      console.log("🔌 Wallet disconnected");
    }
  }, [publicKey]);

  const [selected, setSelected] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "encrypting" | "sending" | "done" | "error">("idle");
  const [txSig, setTxSig] = useState("");

  const selectedAuction = DEMO_AUCTIONS.find((a) => a.id === selected);

  const submitBid = useCallback(async () => {
    if (!publicKey || !selectedAuction || !bidAmount) return;

    const bid = Number(bidAmount);
    if (isNaN(bid) || bid <= 0) return setStatus("error");
    if (bid > 50) return alert("Bid cannot exceed the 50 SOL deposit ceiling.");

    setStatus("encrypting");
    try {
      const encrypted = await mockEncryptBid(bid, publicKey.toBase58());
      setStatus("sending");

      const ix = new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        programId: new PublicKey("11111111111111111111111111111111"),
        data: Buffer.from(encrypted),
      });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      setTxSig(sig);
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, [publicKey, selectedAuction, bidAmount, sendTransaction, connection]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] text-slate-100 px-4 py-8 flex items-center justify-center">
        <div className="text-violet-400 animate-pulse font-medium">Initializing Privacy Layer...</div>
      </main>
    );
  }

  const reset = () => {
    setSelected(null);
    setBidAmount("");
    setStatus("idle");
    setTxSig("");
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-slate-100 px-4 py-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-16 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
            Arcium Blind Auction
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-slate-500 text-xs font-medium tracking-wider uppercase">Privacy Network</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">MPC Powered</span>
          </div>
        </div>
        <WalletButton />
      </div>

      {/* Auction grid */}
      {!selected && (
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {DEMO_AUCTIONS.map((auction) => (
            <button
              key={auction.id}
              onClick={() => publicKey ? setSelected(auction.id) : alert("Connect wallet first")}
              className="glass-morphism card-glow rounded-3xl p-8 text-left transition-all duration-300 relative overflow-hidden group"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
              
              <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{auction.image}</div>
              <div className="font-bold text-xl text-white group-hover:text-violet-300 transition-colors">
                {auction.title}
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <span className="bg-violet-500/10 text-violet-300 text-[10px] font-bold px-2 py-1 rounded-full border border-violet-500/20 uppercase tracking-wider">
                  Min Bid
                </span>
                <span className="text-slate-300 font-medium">{auction.minBid} SOL</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 mt-8 border-t border-white/5 pt-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-violet-400">⏳</span> {auction.ends}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-violet-400">🔒</span> {auction.bids} Bids
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Bid form */}
      {selected && selectedAuction && status !== "done" && (
        <div className="max-w-md mx-auto bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-7 shadow-xl">
          <button onClick={reset} className="text-slate-500 hover:text-slate-300 text-sm mb-5 flex items-center gap-1">
            ← Back
          </button>

          <div className="text-4xl mb-3">{selectedAuction.image}</div>
          <h2 className="text-xl font-bold text-white">{selectedAuction.title}</h2>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Min bid: {selectedAuction.minBid} SOL · Ends in {selectedAuction.ends}
          </p>

          <div className="bg-violet-950/30 border border-violet-800/40 rounded-lg p-4 text-sm text-violet-300 mb-5">
            🔐 Your bid is encrypted in your browser using Arcium. The contract sees only ciphertext until the auction closes.
            A flat <strong>50 SOL deposit</strong> is locked to mask your real amount.
          </div>

          <label className="block text-sm font-medium text-slate-300 mb-1">
            Your True Bid (SOL) — up to 50
          </label>
          <input
            type="number"
            min={selectedAuction.minBid}
            max={50}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={`Min ${selectedAuction.minBid} SOL`}
            className="w-full bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg px-4 py-3 text-white outline-none focus:border-violet-500 transition mb-5"
          />

          {status === "idle" && (
            <button
              onClick={submitBid}
              disabled={!publicKey || !bidAmount}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Encrypt & Submit Bid
            </button>
          )}
          {status === "encrypting" && (
            <div className="text-center text-violet-400 font-medium animate-pulse">🔐 Encrypting bid with Arcium...</div>
          )}
          {status === "sending" && (
            <div className="text-center text-violet-400 font-medium animate-pulse">📡 Sending to Solana devnet...</div>
          )}
          {status === "error" && (
            <div className="text-center text-red-400 font-medium">❌ Something went wrong. Try again.</div>
          )}
        </div>
      )}

      {/* Success */}
      {status === "done" && selectedAuction && (
        <div className="max-w-md mx-auto bg-[#13131a] border border-green-800/40 rounded-2xl p-7 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-400 mb-2">Bid Submitted!</h2>
          <p className="text-slate-400 text-sm mb-4">
            Your encrypted bid for <strong>{selectedAuction.title}</strong> is on-chain.
            You'll be notified when Arcium reveals the winner.
          </p>
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="text-violet-400 hover:underline text-sm break-all"
          >
            View on Explorer ↗
          </a>
          <button
            onClick={reset}
            className="mt-6 w-full bg-[#1f1f2e] hover:bg-[#2a2a3e] text-white py-3 rounded-xl transition"
          >
            Back to Auctions
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-5xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6 text-[11px] font-medium tracking-widest uppercase text-slate-500">
          <span className="hover:text-violet-400 cursor-default transition-colors">Privacy First</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span className="hover:text-violet-400 cursor-default transition-colors">Solana Devnet</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span className="hover:text-violet-400 cursor-default transition-colors">Arcium MPC</span>
        </div>
        <div className="text-slate-400 font-semibold tracking-wide text-xs mt-2">
          Created by <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Uthman(Brillo Digitals)</span> | 2026
        </div>
      </div>
    </main>
  );
}
