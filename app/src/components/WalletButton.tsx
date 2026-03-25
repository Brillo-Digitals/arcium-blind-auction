"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useState, useRef, useEffect } from "react";

export function WalletButton() {
  const { publicKey, wallet, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const baseAddr = publicKey?.toBase58();
  const truncated = baseAddr ? `${baseAddr.slice(0, 4)}...${baseAddr.slice(-4)}` : "";

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-900/20 active:scale-95 flex items-center gap-2"
      >
        <span>Select Wallet</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="glass-morphism px-5 py-2.5 rounded-xl flex items-center gap-3 border border-white/10 hover:border-violet-500/50 transition-all group active:scale-95 shadow-xl"
      >
        {wallet?.adapter.icon && (
          <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-5 h-5 rounded-md" />
        )}
        <span className="font-bold text-sm text-slate-100 group-hover:text-violet-300 transition-colors">
          {truncated}
        </span>
        <svg
          className={`w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-48 glass-morphism rounded-2xl border border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2">
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
