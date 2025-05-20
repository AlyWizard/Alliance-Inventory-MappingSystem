import React, { useState, useEffect } from 'react';
import { FaSearch, FaSyncAlt, FaPlus, FaFileExport, FaTrash, FaEdit, FaFilter } from 'react-icons/fa';
import axios from '../api';
import AddAssetModal from '../components/AssetModals/AddAssetModal';
import AssignAssetModal from '../components/AssetModals/AssignAssetModal';
import EditAssetModal from '../components/AssetModals/EditAssetModal';

const Assets = () => {
  // State for assets data
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for categories and models (for dropdowns)
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);

  // State for selected items
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);
  
  // State for filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    categoryID: '',
    modelID: '',
    assetStatus: '',
    assigned: ''
  });

  // Status options with their corresponding colors
  const statusOptions = [
    { value: 'Ready to Deploy', color: 'bg-green-500' },
    { value: 'Onsite', color: 'bg-blue-400' },
    { value: 'WFH', color: 'bg-cyan-400' },
    { value: 'Temporarily Deployed', color: 'bg-pink-500' },
    { value: 'Borrowed', color: 'bg-orange-400' },
    { value: 'Defective', color: 'bg-red-500' }
  ];

  // Fetch assets and related data on component mount
  useEffect(() => {
    fetchAssets();
    fetchCategories();
    fetchModels();
  }, []);

  // Fetch assets from API
  const fetchAssets = async () => {
    setLoading(true);
    try {
      console.log('Fetching assets...');
      const response = await axios.get('/api/assets');
      console.log('Assets response:', response.data);
      setAssets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(`Failed to load assets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch models for dropdown
  const fetchModels = async () => {
    try {
      const response = await axios.get('/api/models');
      setModels(response.data);
    } catch (err) {
      console.error('Error fetching models:', err);
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

  // Handle bulk asset deletion with assignment check
  const handleBulkDelete = async () => {
    if (!selectedItems.length) return;
    
    try {
      // Check if any selected assets are assigned
      const assignedAssets = assets
        .filter(asset => selectedItems.includes(asset.assetID) && asset.workStationID !== null);
      
      if (assignedAssets.length > 0) {
        const assetNames = assignedAssets.map(asset => asset.assetName).join(', ');
        setError(`Cannot delete assigned assets: ${assetNames}. Please unassign these assets first.`);
        return;
      }
      
      if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected asset(s)?`)) {
        setLoading(true);
        try {
          // Delete each selected asset
          await Promise.all(selectedItems.map(id => 
            axios.delete(`/api/assets/${id}`)
          ));
          
          // Refresh assets and clear selection
          fetchAssets();
          setSelectedItems([]);
        } catch (err) {
          console.error('Error deleting assets:', err);
          setError('Failed to delete assets. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error checking asset assignment status:', err);
      setError('Failed to check asset assignment status. Please try again.');
    }
  };

  // Handle single asset deletion
  const handleSingleDelete = async (id) => {
    // Get the asset to check if it's assigned
    const asset = assets.find(a => a.assetID === id);
    
    if (asset && asset.workStationID !== null) {
      setError(`Cannot delete assigned asset: ${asset.assetName}. Please unassign this asset first.`);
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this asset?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/assets/${id}`);
        // Refresh assets and remove from selected items if present
        fetchAssets();
        setSelectedItems(selectedItems.filter(item => item !== id));
      } catch (err) {
        console.error('Error deleting asset:', err);
        setError('Failed to delete asset. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle edit asset
  const handleEdit = async (assetId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/assets/${assetId}`);
      console.log('Fetched asset for editing:', response.data);
      setCurrentAsset(response.data);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error fetching asset details:', err);
      setError('Failed to fetch asset details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      categoryID: '',
      modelID: '',
      assetStatus: '',
      assigned: ''
    });
    setSearchTerm('');
    setFilterOpen(false);
  };

  // Filter assets based on search and filters
  const filteredAssets = assets.filter(asset => {
    // Search filter
    const matchesSearch = (
      asset.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Category filter
    const matchesCategory = filters.categoryID === '' || 
      asset.categoryID?.toString() === filters.categoryID;
    
    // Model filter
    const matchesModel = filters.modelID === '' || 
      asset.modelID?.toString() === filters.modelID;
    
    // Status filter
    const matchesStatus = filters.assetStatus === '' || 
      asset.assetStatus === filters.assetStatus;
    
    // Assignment filter
    const matchesAssignment = filters.assigned === '' || 
      (filters.assigned === 'assigned' && asset.workStationID !== null) ||
      (filters.assigned === 'unassigned' && asset.workStationID === null);
    
    return matchesSearch && matchesCategory && matchesModel && matchesStatus && matchesAssignment;
  });

  // Handle successful asset addition
  const handleAssetAdded = (newAsset) => {
    console.log('New asset added:', newAsset);
    fetchAssets(); // Refresh the assets list
  };

  // Handle successful asset update
  const handleAssetUpdated = (updatedAsset) => {
    console.log('Asset updated:', updatedAsset);
    fetchAssets(); // Refresh the assets list
  };

  // Handle successful asset assignment
  const handleAssignmentSuccess = (updatedAssets) => {
    console.log('Assets assigned:', updatedAssets);
    fetchAssets(); // Refresh the assets list
    setSelectedItems([]); // Clear selection
  };

  // Format date to match the design
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'bg-gray-500';
  };

  // Export assets to CSV
  const exportToCSV = () => {
    // Prepare data for export
    const csvData = filteredAssets.map(asset => ({
      'Asset Name': asset.assetName || '',
      'Asset Tag': asset.assetTag || '',
      'Serial Number': asset.serialNo || '',
      'Category': asset.categoryName || '',
      'Model': asset.modelName || '',
      'Status': asset.assetStatus || '',
      'Assigned To': asset.empFirstName && asset.empLastName ? `${asset.empFirstName} ${asset.empLastName}` : 'Not Assigned',
      'Workstation': asset.workstationName || 'None',
      'Date Added': formatDate(asset.created_at)
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
    a.download = `assets_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check if selected assets are assignable (not already assigned)
  const checkAssignableAssets = () => {
    const assignedAssets = assets
      .filter(asset => selectedItems.includes(asset.assetID) && asset.workStationID !== null);
    
    if (assignedAssets.length > 0) {
      const assetNames = assignedAssets.map(asset => asset.assetName).join(', ');
      setError(`Cannot assign these assets because they are already assigned: ${assetNames}. Please unassign these assets first.`);
      return false;
    }
    
    return true;
  };

  return (
    <div className="flex min-h-screen bg-[#0f1a1f] text-white font-sans">
      {/* Left Sidebar */}
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
        <div className="px-4 mb-3 text-gray-400 font-medium" >
          Inventories
        </div>

        {/* Inventories Container */}
        <div className="mx-4 bg-[#16282F] rounded-md mb-6 border border-[#273C45] overflow-hidden">
          {/* Main Menu Items */}
          <div className="p-2 space-y-1">
            {/* Employees */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/employees'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M17 2L12 7 7 2"></path>
              </svg>
              <span>Employees</span>
            </div>
            
            {/* Departments */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/employees'}> 
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Departments</span>
            </div>
            
            {/* Companies */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/employees'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>Companies</span>
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
            {/* Assets (Active) */}
            <div className="bg-[#38b6ff] text-white rounded flex items-center gap-2 p-2" >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>Assets</span>
            </div>
            
            {/* Asset Status Indicators */}
            <div className="pl-6 space-y-1.5 mt-2">
              {statusOptions.map(status => (
                <div key={status.value} className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                  <span>{status.value}</span>
                </div>
              ))}
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

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        {/* Title Bar Container */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Alliance Assets</h1>
          <div className="flex gap-2 items-center">
            {/* Refresh Button */}
            <button 
              className="bg-[#13232c] border border-[#273C45] rounded-md w-8 h-8 flex items-center justify-center"
              onClick={fetchAssets}
            >
              <FaSyncAlt className="w-4 h-4" />
            </button>
            
            {/* Add Button */}
            <button 
              className="bg-[#13232c] border border-[#273C45] rounded-md flex items-center gap-1.5 px-3 py-1 text-[#38b6ff]"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FaPlus className="text-sm" />
              <span>Add</span>
            </button>
            
            {/* Assign Button */}
            <button 
              className="bg-[#13232c] border border-[#273C45] rounded-md flex items-center gap-1.5 px-3 py-1 text-[#38b6ff]"
              onClick={() => {
                if (selectedItems.length > 0) {
                  if (checkAssignableAssets()) {
                    setIsAssignModalOpen(true);
                  }
                } else {
                  alert("Please select at least one asset to assign");
                }
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Assign</span>
            </button>
            
            {/* Export Button */}
            <button 
              className="bg-[#41b853] rounded-md flex items-center gap-1.5 px-3 py-1"
              onClick={exportToCSV}
            >
              <FaFileExport className="w-4 h-4" />
              <span>EXPORT</span>
            </button>
            
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Here"
                className="bg-[#13232c] text-white pl-10 pr-4 py-1.5 rounded-md border border-[#273C45] w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Filter Button */}
            <button 
              className={`bg-[#13232c] border border-[#273C45] rounded-md flex items-center gap-1.5 px-3 py-1 ${filterOpen ? 'text-[#38b6ff]' : ''}`}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <FaFilter className="w-3 h-3" />
              <span>Filter</span>
            </button>
            
            {/* Delete Button */}
            <button 
              className={`bg-[#13232c] border border-[#273C45] rounded-md w-8 h-8 flex items-center justify-center ${selectedItems.length > 0 ? 'text-[#ff3e4e]' : 'text-gray-500'}`}
              onClick={handleBulkDelete}
              disabled={selectedItems.length === 0}
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Filter Panel */}
        {filterOpen && (
          <div className="bg-[#16282F] rounded-md p-4 mb-4 border border-[#273C45]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Filter Options</h3>
              <button 
                onClick={resetFilters}
                className="text-sm text-gray-400 hover:text-white"
              >
                Reset Filters
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Category</label>
                <select
                  name="categoryID"
                  value={filters.categoryID}
                  onChange={handleFilterChange}
                  className="w-full bg-[#1F3A45] rounded p-2"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.categoryID} value={category.categoryID}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Filter */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Model</label>
                <select
                  name="modelID"
                  value={filters.modelID}
                  onChange={handleFilterChange}
                  className="w-full bg-[#1F3A45] rounded p-2"
                >
                  <option value="">All Models</option>
                  {models.map(model => (
                    <option key={model.modelID} value={model.modelID}>
                      {model.modelName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <select
                  name="assetStatus"
                  value={filters.assetStatus}
                  onChange={handleFilterChange}
                  className="w-full bg-[#1F3A45] rounded p-2"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Filter */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Assignment</label>
                <select
                  name="assigned"
                  value={filters.assigned}
                  onChange={handleFilterChange}
                  className="w-full bg-[#1F3A45] rounded p-2"
                >
                  <option value="">All</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#38b6ff]"></div>
          </div>
        )}
        
        {/* Empty state message */}
        {assets.length === 0 && !loading && !error && (
          <div className="py-8 text-center bg-[#16282F] rounded-md p-6">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400 mb-3" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <p className="text-gray-400 mb-4">No assets found. Click the Add button to create your first asset.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 bg-[#0075A2] hover:bg-[#0088BC] text-white py-2 px-6 rounded-md"
            >
              Add Your First Asset
            </button>
          </div>
        )}
        
        {/* Table */}
        {assets.length > 0 && (
          <div className="bg-[#16282F] rounded-md overflow-hidden">
            {/* Table Header */}
            <div className="bg-[#13232c] grid grid-cols-10 py-3 px-4 text-gray-300">
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  className="w-4 h-4 bg-transparent border-gray-600 accent-[#38b6ff]"
                  checked={selectedItems.length === filteredAssets.length && filteredAssets.length > 0}
                  onChange={handleSelectAll}
                  disabled={filteredAssets.length === 0}
                />
              </div>
              <div>Asset Name</div>
              <div>Image</div> 
              <div>Asset Tag</div>
              <div>Serial Number</div>
              <div>Model</div>
              <div>Category</div>
              <div>Status</div>
              <div>Assigned</div>
              <div className="text-center">Actions</div>
            </div>
            
            {/* Table Rows */}
            {filteredAssets.length === 0 ? (
              <div className="py-4 px-4 text-center text-gray-400">
                {loading ? 'Loading assets...' : 'No assets found matching your filters.'}
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <div 
                  key={asset.assetID} 
                  className="grid grid-cols-10 py-3 px-4 border-b border-[#1e2d36] hover:bg-[#182a35] transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 bg-transparent border-gray-600 accent-[#38b6ff]"
                      checked={selectedItems.includes(asset.assetID)}
                      onChange={() => handleSelect(asset.assetID)}
                    />
                  </div>
                  <div>
                    {asset.assetName}
                    {asset.workStationID && asset.empFirstName && (
                      <div className="text-xs text-gray-400 mt-1">
                        Assigned to: {asset.empFirstName} {asset.empLastName}
                      </div>
                    )}
                  </div>
                  <div>
                  {asset.imagePath ? (
                    <div className="w-10 h-10 rounded overflow-hidden bg-[#1F3A45] flex items-center justify-center">
                      <img 
                        src={`http://localhost:3001/uploads/assets/${asset.imagePath.split('\\').pop()}`} 
                        alt={asset.assetName || "Asset"} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.log("Image failed to load:", asset.imagePath);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded bg-[#1F3A45] flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                  )}
                  </div>
                  <div>{asset.assetTag}</div>
                  <div>{asset.serialNo}</div>
                  <div>{asset.modelName || 'N/A'}</div>
                  <div>{asset.categoryName || 'N/A'}</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColorClass(asset.assetStatus)}`}></div>
                    <span>{asset.assetStatus}</span>
                  </div>
                  <div className="flex items-center">
                    {asset.workStationID ? (
                      <div className="flex items-center text-green-400">
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Yes</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>No</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <button 
                      onClick={() => handleEdit(asset.assetID)}
                      className="text-[#38b6ff] hover:text-[#5bc2ff]"
                      title="Edit asset"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleSingleDelete(asset.assetID)}
                      className={`text-[#ff3e4e] hover:text-[#ff6b78] ${asset.workStationID !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={asset.workStationID !== null ? "Cannot delete assigned asset" : "Delete asset"}
                      disabled={asset.workStationID !== null}
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Add Asset Modal */}
      <AddAssetModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={(newAsset) => {
          // Handle the newly created asset
          handleAssetAdded(newAsset);
          setIsAddModalOpen(false);
        }} 
      />

      {/* Assign Asset Modal */}
      <AssignAssetModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        assetIds={selectedItems} 
        onSuccess={(updatedAssets) => {
          // Handle the assignment success
          handleAssignmentSuccess(updatedAssets);
          setIsAssignModalOpen(false);
        }} 
      />

      {/* Edit Asset Modal */}
      {currentAsset && (
        <EditAssetModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          asset={currentAsset}
          onSuccess={(updatedAsset) => {
            // Handle the updated asset
            handleAssetUpdated(updatedAsset);
            setIsEditModalOpen(false);
          }} 
        />
      )}
    </div>
  );
};

export default Assets;