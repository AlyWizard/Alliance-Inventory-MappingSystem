import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaSync, FaPlus, FaUserPlus, FaFileExport, FaTrash, FaExchangeAlt, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import axios from '../api';
import SelectAssetsModal from '../components/AssetInventoryModals/SelectAssetsModal';
import TransferAssetModal from '../components/AssetInventoryModals/TransferAssetModal';

const AssetInventory = () => {
  // Get employee ID from URL params
  const { employeeId } = useParams();
  const navigate = useNavigate();
  
  // State for assets data
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for selected items
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for modals
  const [isSelectAssetsModalOpen, setIsSelectAssetsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // Employee data
  const [employeeData, setEmployeeData] = useState({
    empID: '',
    empFirstName: '',
    empLastName: '',
    empUserName: '',
    empDept: '',
    employeeStatus: '',
    workstation: '' // This will store the workstation name
  });
  
  // Current workstation ID
  const [currentWorkstationId, setCurrentWorkstationId] = useState(null);
  
  // Available workstations for assignment
  const [availableWorkstations, setAvailableWorkstations] = useState([]);

  // Get employee ID from URL or props
  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData(employeeId);
    }
  }, [employeeId]);

  // Fetch employee data
  const fetchEmployeeData = async (empId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/employees/${empId}`);
      setEmployeeData({
        empID: response.data.empID,
        empFirstName: response.data.empFirstName,
        empLastName: response.data.empLastName,
        empUserName: response.data.empUserName,
        empDept: response.data.empDept,
        employeeStatus: response.data.employeeStatus,
        workstation: 'Loading...' // Will be updated when we fetch workstations
      });
      
      // Fetch employee workstations and then assets
      fetchEmployeeWorkstations(empId);
      fetchAvailableWorkstations();
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError('Failed to load employee data. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch all available workstations
  const fetchAvailableWorkstations = async () => {
    try {
      const response = await axios.get('/api/workstations');
      setAvailableWorkstations(response.data);
    } catch (err) {
      console.error('Error fetching available workstations:', err);
    }
  };
  
  // Fetch employee workstations
  const fetchEmployeeWorkstations = async (empId) => {
    try {
      const response = await axios.get(`/api/employees/${empId}/workstations`);
      
      if (response.data.length > 0) {
        // Use the first workstation
        const workstation = response.data[0];
        setCurrentWorkstationId(workstation.workStationID);
        
        // Update employee data with workstation name
        setEmployeeData(prev => ({
          ...prev,
          workstation: workstation.modelName
        }));
        
        // Now fetch assets for this workstation
        fetchEmployeeAssets(empId);
      } else {
        // No workstations assigned yet
        setEmployeeData(prev => ({
          ...prev,
          workstation: 'No workstation assigned'
        }));
        setAssets([]);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching workstations:', err);
      setEmployeeData(prev => ({
        ...prev,
        workstation: 'Error loading workstation'
      }));
      setLoading(false);
    }
  };

  // Fetch assets assigned to this employee
  const fetchEmployeeAssets = async (empId) => {
    try {
      // Get assets assigned to this employee's workstations
      const response = await axios.get(`/api/employees/${empId}/assets`);
      setAssets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching employee assets:', err);
      setError('Failed to load assets. Please try again.');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox selection
  const handleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === filteredAssets.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredAssets.map(asset => asset.assetID));
    }
  };

  // Handle successful asset assignment
  //onst handleAssignmentSuccess = (assignmentData) => {
    //fetchEmployeeAssets(employeeData.empID); // Refresh the assets list
   // setSelectedItems([]); // Clear selection
  //};

  // Handle successful asset assignment
const handleAssignmentSuccess = async (assignmentData) => {
  try {
    // assignmentData contains: selectedAssetIds, assetStatus, employeeId
    const { selectedAssetIds, assetStatus } = assignmentData;
    
    if (!currentWorkstationId) {
      setError('No workstation available for this employee. Please create a workstation first.');
      return;
    }
    
    // Assign the selected assets to the employee's current workstation
    await axios.post('/api/assets/assign', {
      assetIds: selectedAssetIds,
      workStationID: currentWorkstationId,
      assetStatus: assetStatus
    });
    
    // Refresh the assets list
    fetchEmployeeAssets(employeeData.empID);
    setSelectedItems([]); // Clear selection
    setError(null); // Clear any errors
    
  } catch (err) {
    console.error('Error assigning assets:', err);
    setError('Failed to assign assets. Please try again.');
  }
};
  
  // Handle successful asset transfer
  const handleTransferSuccess = () => {
    fetchEmployeeAssets(employeeData.empID); // Refresh the assets list
    setSelectedItems([]); // Clear selection
  };
  
  // Handle unassign assets
  const handleUnassignAssets = async () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one asset to unassign");
      return;
    }
    
    if (window.confirm(`Are you sure you want to unassign ${selectedItems.length} selected asset(s)?`)) {
      setLoading(true);
      try {
        await axios.post('/api/assets/unassign', {
          assetIds: selectedItems
        });
        
        // Refresh assets and clear selection
        fetchEmployeeAssets(employeeData.empID);
        setSelectedItems([]);
        setError(null);
      } catch (err) {
        console.error('Error unassigning assets:', err);
        setError('Failed to unassign assets. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Export assets to CSV
  const exportToCSV = () => {
    if (filteredAssets.length === 0) {
      setError("No assets to export");
      return;
    }
    
    // Prepare data for export
    const csvData = filteredAssets.map(asset => ({
      'Asset Name': asset.assetName || '',
      'Asset Tag': asset.assetTag || '',
      'Serial Number': asset.serialNo || '',
      'Category': asset.categoryName || '',
      'Model': asset.modelName || '',
      'Status': asset.assetStatus || '',
      'Workstation': asset.workstationName || 'None',
      'Date Added': new Date(asset.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }));
    
    // Convert to CSV
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => {
        const cell = row[header] || '';
        return `"${cell.toString().replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    
    // Download the CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_assets_${employeeData.empID}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter assets based on search 
  const filteredAssets = assets.filter(asset => 
    asset.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.serialNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle back button click
  //const handleBackToEmployees = () => {
   // navigate('/employees');
  //};
  // Update the handleBackToEmployees function
const handleBackToEmployees = () => {
  // Check where we came from
  if (location.state?.from) {
    // If we have a "from" in state, go there
    navigate(location.state.from);
  } else if (document.referrer && document.referrer.includes(window.location.origin)) {
    // Try to use the referrer as a fallback
    const url = new URL(document.referrer);
    navigate(url.pathname);
  } else {
    // Default fallback to employees
    navigate('/employees');
  }
};

  return (
    <div className="flex min-h-screen bg-[#0f1a1f] text-white font-sans">
      {/* Left Sidebar - Keeping the original sidebar */}
      <aside className="w-64 bg-[#13232c]">
        {/* Logo Section */}
        <div className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#1e4975] w-12 h-12 rounded-md flex items-center justify-center">
              <div className="text-white font-bold text-lg">Esc</div>
            </div>
            <div>
              <div className="text-[#41b853] text-3xl font-bold leading-none">Esc</div>
              <div className="text-[#41b853] text-[10px] tracking-widest">CORPORATION</div>
            </div>
          </div>
        </div>

        {/* Floor Mapping Container */}
        <div className="px-4 mb-6">
          <div className="rounded-md border border-[#273C45] overflow-hidden" onClick={() => window.location.href = '/dashboard'}>
            <button className="w-full py-3 px-4 bg-[#16282F] text-[#38b6ff] text-left">
              Floor Mapping
            </button>
          </div>
        </div>

        {/* Inventories Header */}
        <div className="px-4 mb-3 text-gray-400 font-medium">
          Inventories
        </div>

        {/* Inventories Container */}
        <div className="mx-4 bg-[#16282F] rounded-md mb-6 border border-[#273C45] overflow-hidden">
          {/* Main Menu Items */}
          <div className="p-2 space-y-1">
            {/* Employees */}
            <div 
              className="bg-[#38b6ff] text-white rounded flex items-center gap-2 p-2 cursor-pointer"
              onClick={handleBackToEmployees}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M17 2L12 7 7 2"></path>
              </svg>
              <span>Employees</span>
            </div>
            
            {/* Departments */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/department'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Departments</span>
            </div>
            
            {/* Workstations */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/workstation'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>Workstations</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#273C45]"></div>

          <div className="p-2 space-y-1">
            {/* Manufacturers */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/manufacturer'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <span>Manufacturers</span>
            </div>
            
            {/* Categories */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/categories'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
              <span>Categories</span>
            </div>
            
            {/* Models */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/model'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Models</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#273C45]"></div>

          <div className="p-2">
            {/* Assets */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>Assets</span>
            </div>
            
            {/* Asset Status Indicators */}
            <div className="pl-6 space-y-1.5 mt-2">
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Ready to Deploy</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-blue-400"></div><span>Onsite (Deployed)</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-cyan-400"></div><span>WFH (Deployed)</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-pink-500"></div><span>Temporarily Deployed</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-orange-400"></div><span>Borrowed by ESC</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Defective</span></div>
            </div>
          </div>
        </div>

        {/* Bottom Buttons Container */}
        <div className="px-4 mt-auto absolute bottom-4 w-64">
          <div className="flex gap-2">
            <button className="bg-[#1a3a4a] p-2 rounded flex-1 flex items-center justify-center flex-col">
              <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span className="text-xs">Activity Reports</span>
            </button>
            <button className="bg-[#1a3a4a] p-2 rounded flex-1 flex items-center justify-center flex-col">
              <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span className="text-xs">Backup & Restore</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        
      {/* Page Header */}
      <div className="bg-[#13232c] p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">
            Employee Asset Inventory
          </h1>
          
          <button 
            className="flex items-center gap-1 text-gray-400 hover:text-white bg-[#1a3a4a] px-3 py-1.5 rounded-md"
            onClick={handleBackToEmployees}
          >
            <FaArrowLeft /> <span>Go back</span>
          </button>
        </div>
      </div>
        
        {/* Employee Info Bar */}
        <div className="bg-[#25424D] rounded-lg mx-10 mb-6 overflow-hidden shadow-md m-10">
          <div className="flex items-center p-5">
            {/* Employee Icon */}
            <div className="mr-4 flex-shrink-0">
              <svg className="h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="9" r="4"></circle>
              </svg>
            </div>
            
            {/* Employee Information */}
            <div className="grid grid-cols-5 gap-4 flex-1">
              <div className="bg-[#16282F] rounded-lg px-3 py-2 w-20 border-2 border-[#2D5261]">
                <p className="text-gray-400 text-xs">ID</p>
                <p className="font-medium text-white">{employeeData.empID}</p>
              </div>
              
              <div className="bg-[#2D5261] rounded-lg px-3 py-2 border-2 border-[#16282F]">
                <p className="text-gray-400 text-xs">Employee Name</p>
                <p className="font-medium text-white">{`${employeeData.empFirstName} ${employeeData.empLastName}`}</p>
              </div>
              
              <div className="bg-[#2D5261] rounded-lg px-3 py-2 border-2 border-[#16282F]">
                <p className="text-gray-400 text-xs">Username</p>
                <p className="font-medium text-white">{employeeData.empUserName}</p>
              </div>
              
              <div className="bg-[#2D5261] rounded-lg px-3 py-2 border-2 border-[#16282F]">
                <p className="text-gray-400 text-xs">Department</p>
                <p className="font-medium text-white">{employeeData.empDept}</p>
              </div>
              
              <div className="bg-[#2D5261] rounded-lg px-3 py-2 border-2 border-[#16282F]">
                <p className="text-gray-400 text-xs">Workstation</p>
                <p className="font-medium text-white">{employeeData.workstation}</p>
              </div>
            </div>
          </div>
        </div>
    
        {/* Asset Assignment Section */}
        <div className="p-6 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-white">Assets Assigned to Employee</h1>
              
              <div className="flex gap-2">
                {/* Refresh Button */}
                <button 
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => fetchEmployeeAssets(employeeData.empID)}
                >
                  <FaSync size={14} />
                  <span>Refresh</span>
                </button>
                
                {/* Assign Button */}
                <button 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => setIsSelectAssetsModalOpen(true)}
                >
                  <FaUserPlus size={14} />
                  <span>Assign Assets</span>
                </button>
                
                {/* Transfer Button */}
                <button 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => {
                    if (selectedItems.length > 0) {
                      setIsTransferModalOpen(true);
                    } else {
                      setError("Please select at least one asset to transfer");
                    }
                  }}
                  disabled={selectedItems.length === 0}
                >
                  <FaExchangeAlt size={14} />
                  <span>Transfer</span>
                </button>
                
                {/* Export Button */}
                <button 
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={exportToCSV}
                  disabled={assets.length === 0}
                >
                  <FaFileExport size={14} />
                  <span>Export</span>
                </button>
                
                {/* Unassign Button */}
                <button 
                  className="flex items-center justify-center bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={handleUnassignAssets}
                  disabled={selectedItems.length === 0}
                >
                  <FaTrash size={14} />
                  <span className="ml-2">Unassign</span>
                </button>
              </div>
            </div>
            
            {/* Search Field */}
            <div className="mb-4 flex justify-between items-center">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search assets..."
                  className="bg-[#13232c] text-white pl-10 pr-4 py-2 rounded-md border border-[#273C45] w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              <div className="text-gray-400 text-sm">
                {filteredAssets.length} assets found
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4 flex items-center gap-2">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            )}

            {/* Data Table */}
            <div className="bg-slate-800 rounded-md overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="p-4 w-12">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded accent-blue-500"
                        checked={selectedItems.length === filteredAssets.length && filteredAssets.length > 0}
                        onChange={handleSelectAll}
                        disabled={filteredAssets.length === 0}
                      />
                    </th>
                    <th className="p-4">Asset Name</th>
                    <th className="p-4">Image</th>
                    <th className="p-4">Asset Tag</th>
                    <th className="p-4">Serial Number</th>
                    <th className="p-4">Model</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Asset Status</th>
                    <th className="p-4">Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="p-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-4 text-center text-gray-400">
                        {currentWorkstationId ? 
                          'No assets found for this employee.' : 
                          'This employee has no assigned workstation. Assign a workstation first.'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <tr 
                        key={asset.assetID} 
                        className="border-t border-slate-700 hover:bg-slate-700 transition-colors"
                      >
                        <td className="p-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded accent-blue-500"
                            checked={selectedItems.includes(asset.assetID)}
                            onChange={() => handleSelect(asset.assetID)}
                          />
                        </td>
                        <td className="p-4 font-medium">{asset.assetName}</td>
                        <td className="p-4">
                          {asset.imagePath && (
                            <div className="w-10 h-10 rounded overflow-hidden bg-[#1F3A45] flex items-center justify-center">
                              <img 
                                src={`http://localhost:3001/uploads/assets/${asset.imagePath.split('\\').pop()}`} 
                                alt={asset.assetName} 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  console.error("Image failed to load:", asset.imagePath);
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="p-4">{asset.assetTag}</td>
                        <td className="p-4">{asset.serialNo}</td>
                        <td className="p-4">{asset.modelName}</td>
                        <td className="p-4">{asset.categoryName}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            asset.assetStatus === 'Ready to Deploy' ? 'bg-green-500' :
                            asset.assetStatus === 'Onsite' ? 'bg-blue-400' :
                            asset.assetStatus === 'WFH' ? 'bg-cyan-400' :
                            asset.assetStatus === 'Temporarily Deployed' ? 'bg-pink-500' :
                            asset.assetStatus === 'Borrowed' ? 'bg-orange-400' :
                            asset.assetStatus === 'Defective' ? 'bg-red-500' : 'bg-gray-500'
                          }`}>
                            {asset.assetStatus}
                          </span>
                        </td>
                        <td className="p-4">{new Date(asset.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Select Assets Modal */}
      <SelectAssetsModal 
        isOpen={isSelectAssetsModalOpen}
        onClose={() => setIsSelectAssetsModalOpen(false)}
        employeeId={employeeData.empID}
        onSuccess={handleAssignmentSuccess}
      />
      
      {/* Transfer Assets Modal */}
      <TransferAssetModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        assetIds={selectedItems}
        currentWorkstationId={currentWorkstationId}
        currentEmployee={employeeData}  // Add this line
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
};

export default AssetInventory;