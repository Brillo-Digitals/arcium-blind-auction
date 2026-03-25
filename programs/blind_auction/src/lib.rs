use anchor_lang::prelude::*;

declare_id!("BlindAuction1111111111111111111111111111111");

#[program]
pub mod blind_auction {
    use super::*;

    pub fn initialize_auction(
        ctx: Context<InitializeAuction>,
        end_time: i64,
        min_price: u64,
        deposit_amount: u64,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        auction.seller = ctx.accounts.seller.key();
        auction.end_time = end_time;
        auction.min_price = min_price;
        auction.deposit_amount = deposit_amount;
        auction.highest_bid_amount = 0;
        auction.highest_bidder = Pubkey::default();
        auction.state = AuctionState::Active;
        Ok(())
    }

    pub fn submit_bid(ctx: Context<SubmitBid>, encrypted_bid: Vec<u8>) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let bid = &mut ctx.accounts.bid;
        let clock = Clock::get()?;

        require!(clock.unix_timestamp < auction.end_time, AuctionError::AuctionEnded);
        require!(auction.state == AuctionState::Active, AuctionError::AuctionNotActive);

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.bidder.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            auction.deposit_amount,
        )?;

        bid.bidder = ctx.accounts.bidder.key();
        bid.auction = auction.key();
        bid.encrypted_bid = encrypted_bid;
        bid.deposit_amount = auction.deposit_amount;

        Ok(())
    }

    pub fn resolve_auction(
        ctx: Context<ResolveAuction>,
        winning_bidder: Pubkey,
        winning_amount: u64,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let clock = Clock::get()?;

        require!(clock.unix_timestamp >= auction.end_time, AuctionError::AuctionNotEnded);
        require!(auction.state == AuctionState::Active, AuctionError::AuctionNotActive);
        require!(
            ctx.accounts.arcium_relayer.key() == auction.authorized_relayer,
            AuctionError::Unauthorized
        );

        auction.highest_bidder = winning_bidder;
        auction.highest_bid_amount = winning_amount;
        auction.state = AuctionState::Resolved;

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let auction = &ctx.accounts.auction;
        let bid = &mut ctx.accounts.bid;

        require!(auction.state == AuctionState::Resolved, AuctionError::AuctionNotResolved);
        require!(!bid.claimed, AuctionError::AlreadyClaimed);

        bid.claimed = true;

        if bid.bidder == auction.highest_bidder {
            let refund = bid
                .deposit_amount
                .checked_sub(auction.highest_bid_amount)
                .ok_or(AuctionError::ArithmeticUnderflow)?;

            **ctx.accounts.vault.try_borrow_mut_lamports()? -= refund;
            **ctx.accounts.bidder.try_borrow_mut_lamports()? += refund;

            **ctx.accounts.vault.try_borrow_mut_lamports()? -= auction.highest_bid_amount;
            **ctx.accounts.seller.try_borrow_mut_lamports()? += auction.highest_bid_amount;
        } else {
            let refund = bid.deposit_amount;
            **ctx.accounts.vault.try_borrow_mut_lamports()? -= refund;
            **ctx.accounts.bidder.try_borrow_mut_lamports()? += refund;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeAuction<'info> {
    #[account(init, payer = seller, space = 8 + 32 + 8 + 8 + 8 + 8 + 32 + 1 + 32)]
    pub auction: Account<'info, Auction>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitBid<'info> {
    #[account(mut)]
    pub auction: Account<'info, Auction>,
    #[account(init, payer = bidder, space = 8 + 32 + 32 + 4 + 256 + 8 + 1)]
    pub bid: Account<'info, Bid>,
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveAuction<'info> {
    #[account(mut)]
    pub auction: Account<'info, Auction>,
    pub arcium_relayer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    pub auction: Account<'info, Auction>,
    #[account(mut, has_one = bidder, has_one = auction)]
    pub bid: Account<'info, Bid>,
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Auction {
    pub seller: Pubkey,
    pub end_time: i64,
    pub min_price: u64,
    pub deposit_amount: u64,
    pub highest_bid_amount: u64,
    pub highest_bidder: Pubkey,
    pub state: AuctionState,
    pub authorized_relayer: Pubkey,
}

#[account]
pub struct Bid {
    pub bidder: Pubkey,
    pub auction: Pubkey,
    pub encrypted_bid: Vec<u8>,
    pub deposit_amount: u64,
    pub claimed: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AuctionState {
    Active,
    Resolved,
}

#[error_code]
pub enum AuctionError {
    #[msg("Auction ended")]
    AuctionEnded,
    #[msg("Auction not ended")]
    AuctionNotEnded,
    #[msg("Auction not active")]
    AuctionNotActive,
    #[msg("Auction not resolved")]
    AuctionNotResolved,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
}
