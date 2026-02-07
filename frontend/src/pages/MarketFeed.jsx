import { useState, useEffect } from 'react';
import MarketCard from '../components/MarketCard';
import { fetchMarkets } from '../utils/api';

export default function MarketFeed() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    loadMarkets();
  }, [filter]);

  const loadMarkets = async () => {
    setLoading(true);
    try {
      const data = await fetchMarkets(filter);
      setMarkets(data);
    } catch (error) {
      console.error('Failed to load markets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Judge the Stories
        </h1>
        <p className="text-gray-600 text-lg">
          Did they deserve it, or was it pure bad luck? You decide.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        {['active', 'resolved', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-3 px-4 font-medium transition-colors ${
              filter === f
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Markets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading markets...</p>
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No markets found</p>
          <a
            href="/create"
            className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create First Market
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
