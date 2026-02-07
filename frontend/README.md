# FML or Deserved? - Frontend

Beautiful, minimal prediction market UI for judging failure stories.

## Features

- 🎯 **Clean Design** - Calm, professional aesthetic (no casino vibes)
- 💰 **Solana Integration** - Phantom & Solflare wallet support
- 📊 **Real-time Prices** - Live AMM calculations
- 📱 **Mobile Responsive** - Works great on all devices
- ⚡ **One-Click Trading** - Simple, intuitive UX

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Solana Wallet Adapter** - Wallet integration
- **React Router** - Navigation
- **Axios** - API calls

## Getting Started

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── WalletProvider.jsx  # Solana wallet context
│   ├── Navbar.jsx           # Top navigation
│   ├── MarketCard.jsx       # Market preview card
│   ├── PriceChart.jsx       # Visual price bar
│   └── TradingInterface.jsx # Buy shares UI
├── pages/
│   ├── MarketFeed.jsx       # Browse markets
│   ├── MarketDetail.jsx     # Single market view
│   ├── CreateMarket.jsx     # Submit story
│   └── Portfolio.jsx        # User positions
├── utils/
│   └── api.js              # Backend API calls
├── App.jsx                 # Main app component
└── main.jsx               # Entry point
```

## Available Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Connecting to Backend

The frontend expects a backend API at `http://localhost:3000/api` by default.

See `/backend/README.md` for backend setup instructions.

## Deployment

### Build

```bash
npm run build
```

Output will be in `/dist` directory.

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy
```

## Environment Variables

- `VITE_API_URL` - Backend API endpoint
- `VITE_SOLANA_NETWORK` - Solana cluster (devnet/mainnet-beta)

## Design Philosophy

**Calm, not chaotic**
- No flashing animations
- No casino-style graphics
- Clean typography
- Plenty of whitespace

**One-click simplicity**
- Clear call-to-actions
- Minimal form fields
- Instant feedback

**Trust through clarity**
- Show price impact upfront
- Clear fee breakdowns
- Transparent AMM mechanics

## Contributing

This is a hackathon project. Feel free to fork and improve!

## License

MIT
