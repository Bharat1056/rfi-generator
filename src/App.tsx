import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import RfpList from './pages/RfpList';
import RfpDetail from './pages/RfpDetail';
import Vendors from './pages/Vendors';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="rfps" element={<RfpList />} />
          <Route path="rfps/:id" element={<RfpDetail />} />
          <Route path="vendors" element={<Vendors />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
