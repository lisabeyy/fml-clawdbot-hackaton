use anchor_lang::prelude::*;

declare_id!("FMLDeserved11111111111111111111111111111111");

const CREATOR_FEE_BPS: u64 = 200;  // 2%
const PLATFORM_FEE_BPS: u64 = 50;   // 0.5%
const MIN_INITIAL_LIQUIDITY: u64 = 100_000_000; // 0.1 SOL
const MIN_TRADE_AMOUNT: u64 = 1_000_000; // 0.001 SOL
const VOTE_THRESHOLD: u64 = 10; // Votes needed for resolution
const TIME_LIMIT: i64 = 172_800; // 48 hours in seconds

#[program]
pub mod fml_or_deserved {
    use super::*;

    /// Create a new judgment market
    /// 
    /// # Arguments
    /// * `content` - The failure story (max 280 characters)
    /// * `initial_liquidity` - SOL to seed both sides of market
    pub fn create_market(
        ctx: Context<CreateMarket>,
        content: String,
        initial_liquidity: u64,
    ) -> Result<()> {
        require!(content.len() <= 280, ErrorCode::StoryTooLong);
        require!(content.len() >= 10, ErrorCode::StoryTooShort);
        require!(
            initial_liquidity >= MIN_INITIAL_LIQUIDITY,
            ErrorCode::LiquidityTooLow
        );

        // Transfer initial liquidity from creator to market PDA
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.creator.key(),
            &ctx.accounts.market.key(),
            initial_liquidity,
        );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.market.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let market = &mut ctx.accounts.market;
        market.creator = ctx.accounts.creator.key();
        market.content = content;
        
        // Initialize AMM with 50/50 split (neutral judgment)
        let half = initial_liquidity / 2;
        market.deserved_reserve = half;
        market.fml_reserve = half;
        market.k = initial_liquidity; // Constant sum
        
        market.total_volume = 0;
        market.vote_count = 0;
        market.resolved = false;
        market.created_at = Clock::get()?.unix_timestamp;
        market.resolved_at = 0;
        market.bump = ctx.bumps.market;

        msg!("Market created with k={}", market.k);

        Ok(())
    }

    /// Buy shares in a market
    /// 
    /// # Arguments
    /// * `side` - Deserved (0) or FML (1)
    /// * `amount` - SOL to spend on shares
    pub fn buy_shares(
        ctx: Context<BuyShares>,
        side: MarketSide,
        amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(!market.resolved, ErrorCode::MarketResolved);
        require!(amount >= MIN_TRADE_AMOUNT, ErrorCode::AmountTooSmall);

        // Calculate fees
        let creator_fee = amount.checked_mul(CREATOR_FEE_BPS)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;
        let platform_fee = amount.checked_mul(PLATFORM_FEE_BPS)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;
        let net_amount = amount.checked_sub(creator_fee)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_sub(platform_fee)
            .ok_or(ErrorCode::MathOverflow)?;

        // Transfer payment from buyer to market PDA
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &market.key(),
            amount,
        );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                market.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Calculate shares using constant-sum AMM
        // In constant-sum: when you add X to opposite reserve, you get X shares
        let shares = net_amount;

        // Update reserves (maintaining k = deserved + fml)
        match side {
            MarketSide::Deserved => {
                market.fml_reserve = market.fml_reserve.checked_add(net_amount)
                    .ok_or(ErrorCode::MathOverflow)?;
                market.deserved_reserve = market.k.checked_sub(market.fml_reserve)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
            MarketSide::FML => {
                market.deserved_reserve = market.deserved_reserve.checked_add(net_amount)
                    .ok_or(ErrorCode::MathOverflow)?;
                market.fml_reserve = market.k.checked_sub(market.deserved_reserve)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
        }

        // Update position
        let position = &mut ctx.accounts.position;
        if position.owner == Pubkey::default() {
            position.owner = ctx.accounts.buyer.key();
            position.market = market.key();
            position.deserved_shares = 0;
            position.fml_shares = 0;
            position.bump = ctx.bumps.position;
        }

        match side {
            MarketSide::Deserved => {
                position.deserved_shares = position.deserved_shares.checked_add(shares)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
            MarketSide::FML => {
                position.fml_shares = position.fml_shares.checked_add(shares)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
        }

        // Track volume and votes
        market.total_volume = market.total_volume.checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        market.vote_count = market.vote_count.checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        msg!("Bought {} shares of {:?} at market {}", shares, side, market.key());

        // Auto-resolve if conditions met
        if should_resolve(market)? {
            market.resolved = true;
            market.resolved_at = Clock::get()?.unix_timestamp;
            msg!("Market auto-resolved!");
        }

        Ok(())
    }

    /// Claim payout for shares
    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        let market = &ctx.accounts.market;
        let position = &ctx.accounts.position;

        require!(market.resolved, ErrorCode::MarketNotResolved);
        require!(position.owner == ctx.accounts.claimer.key(), ErrorCode::Unauthorized);
        require!(position.market == market.key(), ErrorCode::InvalidPosition);

        // Calculate final prices
        let deserved_price = (market.fml_reserve as u128)
            .checked_mul(1_000_000_000)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(market.k as u128)
            .ok_or(ErrorCode::MathOverflow)? as u64;
        let fml_price = (market.deserved_reserve as u128)
            .checked_mul(1_000_000_000)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(market.k as u128)
            .ok_or(ErrorCode::MathOverflow)? as u64;

        // Calculate payout proportional to final price
        // Each share is worth (final_price / 1e9) * k
        let deserved_payout = (position.deserved_shares as u128)
            .checked_mul(deserved_price as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(1_000_000_000)
            .ok_or(ErrorCode::MathOverflow)? as u64;
        
        let fml_payout = (position.fml_shares as u128)
            .checked_mul(fml_price as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(1_000_000_000)
            .ok_or(ErrorCode::MathOverflow)? as u64;

        let total_payout = deserved_payout.checked_add(fml_payout)
            .ok_or(ErrorCode::MathOverflow)?;

        require!(total_payout > 0, ErrorCode::NoPayout);

        // Transfer payout
        **market.to_account_info().try_borrow_mut_lamports()? = market
            .to_account_info()
            .lamports()
            .checked_sub(total_payout)
            .ok_or(ErrorCode::MathOverflow)?;
        
        **ctx.accounts.claimer.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .claimer
            .lamports()
            .checked_add(total_payout)
            .ok_or(ErrorCode::MathOverflow)?;

        msg!("Claimed payout: {} lamports", total_payout);

        Ok(())
    }

    /// Creator claims their trading fee
    pub fn claim_creator_fee(ctx: Context<ClaimCreatorFee>) -> Result<()> {
        let market = &ctx.accounts.market;

        require!(market.resolved, ErrorCode::MarketNotResolved);
        require!(market.creator == ctx.accounts.creator.key(), ErrorCode::Unauthorized);

        // Creator gets CREATOR_FEE_BPS of total volume
        let creator_fee = market.total_volume.checked_mul(CREATOR_FEE_BPS)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;

        require!(creator_fee > 0, ErrorCode::NoPayout);

        // Transfer fee
        **market.to_account_info().try_borrow_mut_lamports()? = market
            .to_account_info()
            .lamports()
            .checked_sub(creator_fee)
            .ok_or(ErrorCode::MathOverflow)?;
        
        **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .creator
            .lamports()
            .checked_add(creator_fee)
            .ok_or(ErrorCode::MathOverflow)?;

        msg!("Creator claimed fee: {} lamports", creator_fee);

        Ok(())
    }
}

// Helper function
fn should_resolve(market: &Market) -> Result<bool> {
    let elapsed = Clock::get()?.unix_timestamp.checked_sub(market.created_at)
        .ok_or(ErrorCode::MathOverflow)?;
    
    Ok(market.vote_count >= VOTE_THRESHOLD || elapsed >= TIME_LIMIT)
}

// Accounts

#[account]
pub struct Market {
    pub creator: Pubkey,          // 32
    pub content: String,          // 4 + 280
    pub deserved_reserve: u64,    // 8
    pub fml_reserve: u64,         // 8
    pub k: u64,                   // 8 (constant)
    pub total_volume: u64,        // 8
    pub vote_count: u64,          // 8
    pub created_at: i64,          // 8
    pub resolved: bool,           // 1
    pub resolved_at: i64,         // 8
    pub bump: u8,                 // 1
}

impl Market {
    pub const MAX_SIZE: usize = 32 + 4 + 280 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 1;
}

#[account]
pub struct Position {
    pub owner: Pubkey,            // 32
    pub market: Pubkey,           // 32
    pub deserved_shares: u64,     // 8
    pub fml_shares: u64,          // 8
    pub bump: u8,                 // 1
}

impl Position {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 8 + 1;
}

// Context structs

#[derive(Accounts)]
#[instruction(content: String)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Market::MAX_SIZE,
        seeds = [b"market", creator.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + Position::MAX_SIZE,
        seeds = [b"position", market.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    pub position: Account<'info, Position>,
    
    #[account(mut)]
    pub claimer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimCreatorFee<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum MarketSide {
    Deserved,
    FML,
}

// Errors

#[error_code]
pub enum ErrorCode {
    #[msg("Story must be 10-280 characters")]
    StoryTooLong,
    
    #[msg("Story is too short")]
    StoryTooShort,
    
    #[msg("Initial liquidity must be at least 0.1 SOL")]
    LiquidityTooLow,
    
    #[msg("Trade amount must be at least 0.001 SOL")]
    AmountTooSmall,
    
    #[msg("Market has been resolved")]
    MarketResolved,
    
    #[msg("Market has not been resolved yet")]
    MarketNotResolved,
    
    #[msg("Invalid position account")]
    InvalidPosition,
    
    #[msg("No payout available")]
    NoPayout,
    
    #[msg("Math overflow")]
    MathOverflow,
    
    #[msg("Unauthorized")]
    Unauthorized,
}
