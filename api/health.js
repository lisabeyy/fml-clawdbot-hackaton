// Health check endpoint
export default function handler(req, res) {
  res.json({
    status: 'ok',
    mode: 'simulation',
    devnet_enabled: false,
    markets: 4,
    uptime: process.uptime(),
  });
}
