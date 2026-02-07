import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function TradingInterface({ market, onBuy }) {
  const { connected } = useWallet();
  const [side, setSide] = useState('deserved');
  const [amount, setAmount] = useState('0.01');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      await onBuy(side, parseFloat(amount));
      setAmount('0.01');
    } catch (error) {
      console.error('Trade failed:', error);
      alert('Trade failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-bold mb-4">Place Your Judgment</h3>

      {/* Side Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setSide('deserved')}
          className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
            side === 'deserved'
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          😈 Deserved
        </button>
        <button
          onClick={() => setSide('fml')}
          className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
            side === 'fml'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🍀 FML (Unlucky)
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount (SOL)
        </label>
        <input
          type="number"
          step="0.01"
          min="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="0.01"
        />
        <div className="mt-2 flex space-x-2">
          {['0.01', '0.05', '0.1', '0.5'].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {preset} SOL
            </button>
          ))}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={loading || !connected}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
          loading || !connected
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : side === 'deserved'
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-md'
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
        }`}
      >
        {loading ? 'Processing...' : connected ? `Buy ${side === 'deserved' ? 'Deserved' : 'FML'}` : 'Connect Wallet'}
      </button>

      {/* Price Impact Preview */}
      {connected && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Current Price:</span>
            <span className="font-medium">
              {side === 'deserved' ? market.deserved_percent : market.fml_percent}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Est. Shares:</span>
            <span className="font-medium">~{(parseFloat(amount) * 0.975).toFixed(3)} SOL</span>
          </div>
        </div>
      )}
    </div>
  );
}
