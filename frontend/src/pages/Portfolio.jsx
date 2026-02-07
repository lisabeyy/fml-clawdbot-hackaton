import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchPositions } from '../utils/api';

export default function Portfolio() {
  const { publicKey, connected } = useWallet();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      loadPositions();
    }
  }, [connected, publicKey]);

  const loadPositions = async () => {
    setLoading(true);
    try {
      const data = await fetchPositions(publicKey.toString());
      setPositions(data);
    } catch (error) {
      console.error('Failed to load positions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Portfolio</h1>
        <p className="text-gray-600 text-lg mb-6">Connect your wallet to view your positions</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Your Portfolio
        </h1>
        <p className="text-gray-600 text-lg">
          Track your positions and earnings
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading positions...</p>
        </div>
      ) : positions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 text-lg mb-4">No positions yet</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Browse Markets
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((position) => (
            <div key={position.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-gray-800 mb-2">{position.market.content}</p>
                  <div className="flex space-x-4 text-sm">
                    {position.deserved_shares > 0 && (
                      <span className="text-red-600 font-medium">
                        Deserved: {position.deserved_shares} shares
                      </span>
                    )}
                    {position.fml_shares > 0 && (
                      <span className="text-blue-600 font-medium">
                        FML: {position.fml_shares} shares
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {position.current_value} SOL
                  </div>
                  <div className={`text-sm font-medium ${
                    position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {position.pnl >= 0 ? '+' : ''}{position.pnl} SOL
                  </div>
                </div>
              </div>

              {position.market.resolved && (
                <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                  Claim Payout
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
