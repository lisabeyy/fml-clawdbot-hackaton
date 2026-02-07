import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              🎯 FML or Deserved?
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">
                Markets
              </Link>
              <Link to="/create" className="text-gray-600 hover:text-gray-900 font-medium">
                Create
              </Link>
              <Link to="/portfolio" className="text-gray-600 hover:text-gray-900 font-medium">
                Portfolio
              </Link>
            </div>
          </div>
          <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700" />
        </div>
      </div>
    </nav>
  );
}
