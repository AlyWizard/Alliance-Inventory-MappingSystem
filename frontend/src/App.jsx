//App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import AssetInventory from './pages/AssetInventory';
import Dashboard from './pages/Dashbboard';
import WorkstationInventory from './pages/WorkstationInventory';
import Login from './pages/LoginPage';
import EmployeesInventory from './pages/EmployeesInventory';
import Assets from './pages/Assets';
import Categories from './pages/Categories';
import Model from './pages/Model';
import Manufacturer from './pages/Manufacturer';
import Workstation from './pages/Workstation';
import React from 'react';
//import EmployeeAssetInventory from './pages/AssetInventory'; // Import the new component
import FloorMapAssign from './pages/FloorMapAssign';
import ManageAssetModal from './components/ManageAssetsModal';
import AssignEmployeeModal from './components/AssignEmployeeModal';








function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/asset-inventory" element={<AssetInventory />} />
        <Route path="/workstation-inventory" element={<WorkstationInventory />} />
        <Route path="/employees" element={<EmployeesInventory />} />
        <Route path="/employee-assets/:employeeId" element={<AssetInventory />} /> {/* New route for employee assets */}
        <Route path="/assets" element={<Assets />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/model" element={<Model />} />
        <Route path="/manufacturer" element={<Manufacturer />} />
        <Route path="/workstation" element={<Workstation />} />
        <Route path="/floormap" element={<FloorMapAssign />} />
        <Route path="/manageasset" element={<ManageAssetModal />} />
        <Route path="/assignemployee" element={<AssignEmployeeModal />} />



      </Routes>
    </Router>



  );
}

export default App;