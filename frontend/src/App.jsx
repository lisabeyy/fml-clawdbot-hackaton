import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './components/WalletProvider';
import Navbar from './components/Navbar';
import MarketFeed from './pages/MarketFeed';
import MarketDetail from './pages/MarketDetail';
import CreateMarket from './pages/CreateMarket';
import Portfolio from './pages/Portfolio';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            <Routes>
              <Route path="/" element={<MarketFeed />} />
              <Route path="/market/:id" element={<MarketDetail />} />
              <Route path="/create" element={<CreateMarket />} />
              <Route path="/portfolio" element={<Portfolio />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
