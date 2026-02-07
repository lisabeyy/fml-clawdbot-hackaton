import { Link } from 'react-router-dom';
import PriceChart from './PriceChart';

export default function MarketCard({ market }) {
  const { id, content, deserved_percent, fml_percent, vote_count, time_remaining, resolved } = market;

  return (
    <Link to={`/market/${id}`} className="block">
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <p className="text-gray-800 text-lg leading-relaxed flex-1">{content}</p>
          {resolved && (
            <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Resolved
            </span>
          )}
        </div>

        <PriceChart 
          deservedPercent={deserved_percent} 
          fmlPercent={fml_percent} 
        />

        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <span>{vote_count} votes</span>
          {!resolved && time_remaining && (
            <span className="text-gray-500">{time_remaining}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
