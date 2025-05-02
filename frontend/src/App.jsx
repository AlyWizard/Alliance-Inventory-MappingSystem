import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AssetInventory from './pages/AssetInventory';
import Dashboard from './pages/Dashboard';
import WorkstationInventory from './pages/WorkstationInventory';
import Login from './pages/LoginPage';
import EmployeesInventory from './pages/EmployeesInventory';
import Assets from './pages/Assets';
import Categories from './pages/Categories';
import Model from './pages/Model';
import Manufacturer from './pages/Manufacturer';





function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/asset-inventory" element={<AssetInventory />} />
        <Route path="/workstation-inventory" element={<WorkstationInventory />} />
        <Route path="/employees" element={<EmployeesInventory />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/model" element={<Model />} />
        <Route path="/manufacturer" element={<Manufacturer />} />
      </Routes>
    </Router>
  );
}

export default App;