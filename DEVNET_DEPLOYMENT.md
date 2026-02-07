# Devnet Deployment Guide - FML or Deserved?

**Status:** Ready to deploy (simulation mode complete)  
**Current:** Backend API working (9/9 tests)  
**Next:** Deploy Anchor program to Solana devnet  

---

## Prerequisites ✅

### What We Have
- [x] Smart contract written (Anchor/Rust)
- [x] Backend API tested and working
- [x] Demo frontend deployed (Vercel)
- [x] Architecture documented
- [x] Colosseum project created (draft status)

### What We Need
- [ ] AgentWallet connection (for signing)
- [ ] Devnet SOL (via AgentWallet faucet)
- [ ] Anchor CLI installed
- [ ] Deploy program to devnet
- [ ] Update backend to use on-chain state

---

## Step 1: Connect AgentWallet

**Why AgentWallet?**
- ✅ Recommended by Colosseum (not `solana-keygen`)
- ✅ Persistent wallet (survives restarts)
- ✅ Free devnet faucet
- ✅ Policy-controlled signing
- ✅ No private key management

### Connection Flow

```bash
# Step 1: Start connection (sends OTP to email)
curl -X POST https://agentwallet.mcpay.tech/api/connect/start \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL"}'

# Response includes username
# {"success":true,"username":"generated-username"}

# Step 2: User receives 6-digit OTP via email

# Step 3: Complete connection
curl -X POST https://agentwallet.mcpay.tech/api/connect/complete \
  -H "Content-Type: application/json" \
  -d '{
    "username":"generated-username",
    "email":"YOUR_EMAIL",
    "otp":"123456"
  }'

# Response includes API token and addresses
# Save to ~/.agentwallet/config.json
```

### Save Credentials

```json
{
  "username": "your-username",
  "email": "your@email.com",
  "evmAddress": "0x...",
  "solanaAddress": "...",
  "apiToken": "mf_...",
  "moltbookLinked": false
}
```

**Security:** `chmod 600 ~/.agentwallet/config.json`

---

## Step 2: Get Devnet SOL

**Free faucet** (3 requests per 24 hours):

```bash
curl -X POST "https://agentwallet.mcpay.tech/api/wallets/USERNAME/actions/faucet-sol" \
  -H "Authorization: Bearer FUND_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Response:
# {
#   "actionId": "...",
#   "status": "confirmed",
#   "amount": "0.1 SOL",
#   "txHash": "...",
#   "explorer": "https://explorer.solana.com/tx/...",
#   "remaining": 2
# }
```

**Need more?** Request 3 times for 0.3 SOL total (enough for testing).

---

## Step 3: Install Anchor CLI

```bash
# Install Anchor (if not already installed)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Verify
anchor --version
```

---

## Step 4: Configure Anchor Project

Update `Anchor.toml` to use devnet:

```toml
[provider]
cluster = "devnet"
wallet = "~/.agentwallet/solana-key.json"  # We'll export from AgentWallet

[programs.devnet]
fml_or_deserved = "FMLDeserved11111111111111111111111111111111"
```

---

## Step 5: Export Wallet for Anchor

AgentWallet signs server-side, but Anchor needs a keypair file for deployment. We have two options:

### Option A: Use AgentWallet API for signing (recommended)

Create a wrapper script that uses AgentWallet's sign-message endpoint:

```bash
# Sign a Solana transaction via AgentWallet
curl -X POST "https://agentwallet.mcpay.tech/api/wallets/USERNAME/actions/sign-message" \
  -H "Authorization: Bearer FUND_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "solana",
    "message": "TRANSACTION_BYTES_BASE64"
  }'
```

### Option B: Temporary deployment keypair

For initial deployment only, create a temporary keypair, fund it from AgentWallet, deploy, then discard:

```bash
# Generate temporary keypair
solana-keygen new --outfile /tmp/deploy-key.json

# Get address
solana-keygen pubkey /tmp/deploy-key.json

# Transfer SOL from AgentWallet
curl -X POST "https://agentwallet.mcpay.tech/api/wallets/USERNAME/actions/transfer-solana" \
  -H "Authorization: Bearer FUND_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEPLOY_KEY_ADDRESS",
    "amount": "100000000",
    "asset": "sol",
    "network": "devnet"
  }'

# Deploy (uses temporary key)
anchor build
anchor deploy --provider.cluster devnet --provider.wallet /tmp/deploy-key.json

# Transfer remaining SOL back to AgentWallet
solana transfer --from /tmp/deploy-key.json YOUR_AGENTWALLET_ADDRESS ALL --url devnet

# Delete temporary key
rm /tmp/deploy-key.json
```

---

## Step 6: Deploy Contract

```bash
# Build program
cd /home/agent/.openclaw/workspace/prediction-market/contract
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Save program ID from output
# Example: Program ID: FMLDeserved11111111111111111111111111111111
```

**What happens:**
1. Compiles Rust to BPF bytecode
2. Uploads program to Solana devnet
3. Returns program ID (public key)
4. Costs ~1-2 SOL for deployment

---

## Step 7: Initialize Program

After deployment, initialize the program state:

```bash
# Using Anchor client
anchor run initialize --provider.cluster devnet
```

Or manually via TypeScript:

```typescript
import * as anchor from "@project-serum/anchor";

const provider = anchor.AnchorProvider.env();
const program = anchor.workspace.FmlOrDeserved;

await program.methods.initialize()
  .accounts({ /* accounts here */ })
  .rpc();
```

---

## Step 8: Test On-Chain

Create a test market:

```typescript
const tx = await program.methods.createMarket(
  "Test story: I forgot my wallet at home before a date. FML",
  new anchor.BN(100_000_000) // 0.1 SOL
)
.accounts({
  market: marketPda,
  creator: wallet.publicKey,
  systemProgram: anchor.web3.SystemProgram.programId,
})
.rpc();

console.log("Market created:", tx);
```

---

## Step 9: Update Backend

Modify `backend/server.js` to use on-chain state:

```javascript
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@project-serum/anchor';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const programId = new PublicKey('FMLDeserved111...');

// Replace simulation with on-chain reads
async function getMarket(id) {
  const marketPda = deriveMarketPda(id);
  const marketAccount = await program.account.market.fetch(marketPda);
  return formatMarket(marketAccount);
}
```

---

## Step 10: Update Frontend

Add wallet integration (Phantom, Solflare):

```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function TradingInterface() {
  const { publicKey, sendTransaction } = useWallet();
  
  async function buyShares(side, amount) {
    const tx = await program.methods.buyShares(side, amount)
      .accounts({ /* ... */ })
      .transaction();
    
    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature);
  }
}
```

---

## Verification Checklist

Before marking as complete:

- [ ] Program deployed to devnet
- [ ] Program ID saved in config
- [ ] Test market created successfully
- [ ] Buy shares transaction works
- [ ] Market resolves correctly
- [ ] Payout claims work
- [ ] Backend reads on-chain state
- [ ] Frontend connects to wallet
- [ ] Demo video recorded
- [ ] Project updated with devnet info

---

## Costs

**Initial deployment:**
- Program deployment: ~1-2 SOL
- Account rent: ~0.002 SOL per market
- Transaction fees: ~0.00005 SOL per tx

**AgentWallet provides:**
- 0.3 SOL free via faucet (3 x 0.1)
- Enough for deployment + testing

---

## Troubleshooting

### "Insufficient funds"
```bash
# Request more from faucet (max 3 times)
curl -X POST ".../actions/faucet-sol"
```

### "Program not deployed"
```bash
# Check Solana config
solana config get
solana balance --url devnet
```

### "Transaction failed"
```bash
# Increase compute units in program
#[instruction(compute_units = 200_000)]
```

### "Account not found"
```bash
# Verify PDA derivation
solana account MARKET_PDA --url devnet
```

---

## Next Steps After Devnet

1. **Test thoroughly** - All instructions working
2. **Update docs** - Add devnet addresses to README
3. **Create video** - Screen recording of full flow
4. **Forum post** - Share devnet demo
5. **Submit project** - When ready for judging

---

## Resources

- **AgentWallet Skill:** https://agentwallet.mcpay.tech/skill.md
- **Anchor Docs:** https://www.anchor-lang.com/
- **Solana Devnet Explorer:** https://explorer.solana.com/?cluster=devnet
- **Solana Docs:** https://docs.solana.com/

---

**Status:** Ready to deploy when needed  
**Estimated time:** 1-2 hours for full deployment  
**Risk:** Low (simulation already working)
