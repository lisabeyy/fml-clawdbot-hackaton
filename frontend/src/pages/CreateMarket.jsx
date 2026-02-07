import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { createMarket } from '../utils/api';

export default function CreateMarket() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const [content, setContent] = useState('');
  const [liquidity, setLiquidity] = useState('0.1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (content.length < 10) {
      alert('Story must be at least 10 characters');
      return;
    }

    if (content.length > 280) {
      alert('Story must be 280 characters or less');
      return;
    }

    setLoading(true);
    try {
      const market = await createMarket(content, parseFloat(liquidity));
      navigate(`/market/${market.id}`);
    } catch (error) {
      console.error('Failed to create market:', error);
      alert('Failed to create market: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const charCount = content.length;
  const charLimit = 280;
  const isValid = charCount >= 10 && charCount <= charLimit;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Share Your Story
        </h1>
        <p className="text-gray-600 text-lg">
          Tell us about a time things went wrong. Let the community decide: was it deserved, or just bad luck?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        {/* Story Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Story
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Today I tried to impress my date by cooking. Set off fire alarm, sprinklers ruined my laptop, fire department showed up. FML"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows="5"
          />
          <div className="mt-2 flex justify-between text-sm">
            <span className={`${isValid ? 'text-gray-600' : charCount < 10 ? 'text-orange-600' : 'text-red-600'}`}>
              {charCount < 10 ? `${10 - charCount} more characters needed` : ''}
              {charCount > charLimit ? `${charCount - charLimit} characters over limit` : ''}
            </span>
            <span className={`${charCount > charLimit ? 'text-red-600' : 'text-gray-600'}`}>
              {charCount} / {charLimit}
            </span>
          </div>
        </div>

        {/* Initial Liquidity */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Liquidity (SOL)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={liquidity}
            onChange={(e) => setLiquidity(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="mt-2 text-sm text-gray-600">
            You'll earn 2% of all trading volume. Controversial stories generate more trading!
          </p>
        </div>

        {/* Guidelines */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Be honest and entertaining</li>
            <li>Keep it under 280 characters</li>
            <li>Controversial stories earn more</li>
            <li>Your liquidity seeds both sides (50/50)</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !connected || !isValid}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            loading || !connected || !isValid
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
          }`}
        >
          {loading ? 'Creating...' : connected ? 'Create Market' : 'Connect Wallet'}
        </button>
      </form>
    </div>
  );
}
