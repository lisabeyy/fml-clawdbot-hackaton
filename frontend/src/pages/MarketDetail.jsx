import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PriceChart from '../components/PriceChart';
import TradingInterface from '../components/TradingInterface';
import { fetchMarket, buyShares } from '../utils/api';

export default function MarketDetail() {
  const { id } = useParams();
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarket();
  }, [id]);

  const loadMarket = async () => {
    setLoading(true);
    try {
      const data = await fetchMarket(id);
      setMarket(data);
    } catch (error) {
      console.error('Failed to load market:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (side, amount) => {
    try {
      await buyShares(id, side, amount);
      await loadMarket(); // Refresh market data
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading market...</p>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Market not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Story */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {market.content}
        </h1>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Community Judgment</h3>
          <PriceChart
            deservedPercent={market.deserved_percent}
            fmlPercent={market.fml_percent}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{market.vote_count}</div>
            <div className="text-sm text-gray-600">Votes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{market.total_volume} SOL</div>
            <div className="text-sm text-gray-600">Volume</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{market.time_remaining || 'Ended'}</div>
            <div className="text-sm text-gray-600">Time Left</div>
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      {!market.resolved && (
        <TradingInterface market={market} onBuy={handleBuy} />
      )}

      {/* Resolved State */}
      {market.resolved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-900 mb-2">
            Market Resolved
          </h3>
          <p className="text-green-800">
            Final judgment: <strong>
              {market.deserved_percent > market.fml_percent ? 'Deserved' : 'FML'}
            </strong> ({Math.max(market.deserved_percent, market.fml_percent)}%)
          </p>
          <button className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Claim Payout
          </button>
        </div>
      )}
    </div>
  );
}
