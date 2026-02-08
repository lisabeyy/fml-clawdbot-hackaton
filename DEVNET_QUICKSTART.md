# Solana Devnet Quickstart

This guide helps you deploy and test the FML prediction market on Solana devnet.

## Prerequisites

1. **Solana CLI** ([Installation Guide](https://docs.solana.com/cli/install-solana-cli-tools))
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

2. **Anchor Framework** ([Installation Guide](https://www.anchor-lang.com/docs/installation))
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   ```

3. **Node.js 18+** (already required for backend)

## Step 1: Set Up Devnet Wallet

```bash
# Generate a new devnet wallet (if you don't have one)
solana-keygen new --outfile ~/.config/solana/devnet.json

# Set devnet as the cluster
solana config set --url devnet

# Airdrop devnet SOL (you can do this multiple times)
solana airdrop 2
solana airdrop 2

# Check balance
solana balance
```

## Step 2: Build the Smart Contract

```bash
cd contract/

# Build the program
anchor build

# Get the program ID
solana address -k target/deploy/fml_prediction_market-keypair.json
```

## Step 3: Deploy to Devnet

```bash
# Deploy (make sure you have devnet SOL)
anchor deploy --provider.cluster devnet

# The output will show your program ID, copy it!
# Example: Program Id: AxBCdEfG...
```

## Step 4: Update Backend Configuration

1. Copy the program ID from deployment
2. Edit `backend/solana-devnet.js`:
   ```javascript
   this.programId = 'YOUR_PROGRAM_ID_HERE';
   this.enabled = true;
   ```

3. Install Solana Web3 dependencies:
   ```bash
   cd backend/
   npm install @solana/web3.js @project-serum/anchor
   ```

4. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

5. Edit `.env` and set:
   ```
   SOLANA_DEVNET=true
   ```

## Step 5: Start the Backend

```bash
cd backend/
npm run dev
```

You should see:
```
🚀 FML or Deserved API running on http://localhost:3000
📊 Mode: Solana Devnet
🌐 Connected to Solana devnet
📝 Program ID: AxBCdEfG...
```

## Step 6: Test with the Demo Frontend

1. Open `demo-frontend/index.html` in your browser
2. The API will now use real Solana devnet transactions!
3. All market creation and trading will be on-chain

## Testing the Integration

### Create a Market
```bash
curl -X POST http://localhost:3000/api/markets \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Spilled coffee on my laptop during a Zoom call with my boss",
    "initial_liquidity": 0.5,
    "wallet": "YOUR_WALLET_ADDRESS"
  }'
```

### Place a Bet
```bash
curl -X POST http://localhost:3000/api/markets/MARKET_ID/buy \
  -H "Content-Type: application/json" \
  -d '{
    "side": "fml",
    "amount": 0.1,
    "wallet": "YOUR_WALLET_ADDRESS"
  }'
```

### Check Health
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "mode": "devnet",
  "devnet_enabled": true,
  "markets": 3,
  "uptime": 42.5
}
```

## Wallet Integration (Frontend)

To connect user wallets in the demo frontend, you can use:

- **Phantom**: Most popular Solana wallet
- **Solflare**: Another popular option
- **@solana/wallet-adapter-react**: React library for wallet integration

Example with Phantom:
```javascript
// Add to demo-frontend/index.html
const connectWallet = async () => {
  if (window.solana) {
    const response = await window.solana.connect();
    const publicKey = response.publicKey.toString();
    console.log('Connected:', publicKey);
    return publicKey;
  } else {
    alert('Please install Phantom wallet: https://phantom.app/');
  }
};
```

## Useful Commands

### Check Program Logs
```bash
solana logs YOUR_PROGRAM_ID
```

### Get Program Account Info
```bash
solana program show YOUR_PROGRAM_ID
```

### Close Program (to reclaim rent)
```bash
solana program close YOUR_PROGRAM_ID --bypass-warning
```

### Airdrop More Devnet SOL
```bash
solana airdrop 2
```

## Troubleshooting

### "Insufficient funds"
- Airdrop more devnet SOL: `solana airdrop 2`
- Devnet can be slow sometimes, try again in a few minutes

### "Program not found"
- Make sure you deployed: `anchor deploy --provider.cluster devnet`
- Check the program ID is correct in `solana-devnet.js`

### "RPC rate limit exceeded"
- Use a private RPC endpoint (QuickNode, Helius, Alchemy)
- Or wait a few seconds between requests

### Backend shows "simulation mode"
- Make sure `SOLANA_DEVNET=true` in `.env`
- Restart the backend: `npm run dev`

## Production Deployment

When ready for mainnet:
1. Change cluster to mainnet-beta
2. Replace devnet program ID with mainnet program ID
3. Deploy with REAL SOL (expensive!)
4. Set `VITE_SOLANA_NETWORK=mainnet-beta`

⚠️ **Warning**: Mainnet costs real money! Test thoroughly on devnet first.

## Additional Resources

- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor Book](https://www.anchor-lang.com/)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Program Examples](https://github.com/solana-labs/solana-program-library)

## Support

- Check logs: `npm run dev` shows detailed errors
- Test devnet: https://explorer.solana.com/?cluster=devnet
- View transactions: https://solscan.io/ (switch to devnet)
