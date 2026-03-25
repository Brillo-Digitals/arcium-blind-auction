use arcium_sdk::prelude::*;

#[derive(SecureType)]
pub struct SecureBid {
    pub bidder_pubkey: [u8; 32],
    pub amount: u64,
}

#[arcium_program(name = "blind_auction_evaluator")]
pub fn evaluate_auction(bids: Vec<SecureBid>) -> (SecureBytes, SecureU64) {
    let mut highest: u64 = 0;
    let mut winner: [u8; 32] = [0; 32];
    for bid in bids.iter() {
        if bid.amount > highest {
            highest = bid.amount;
            winner = bid.bidder_pubkey;
        }
    }
    arcium_sdk::reveal!(winner, highest)
}

#[arcium_input_decoder]
pub fn decode_inputs(raw_bytes: Vec<Vec<u8>>) -> Vec<SecureBid> {
    raw_bytes.into_iter().map(|b| SecureBid::deserialize(b)).collect()
}
