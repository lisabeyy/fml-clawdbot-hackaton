// Minimal test endpoint
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', message: 'Minimal test works!' });
}
