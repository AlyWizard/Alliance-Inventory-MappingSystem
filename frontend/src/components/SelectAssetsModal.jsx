import React, { useState, useEffect } from 'react';
import axios from '../api';
import { FaSearch, FaSync, FaCheck, FaFilter, FaTimes } from 'react-icons/fa';
import AssignAssetModal from './AssignAssetModal';

const SelectAssetsModal = ({ isOpen, onClose, employeeId }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryID: '',
    modelID: '',
    assetStatus: '',
  });
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);

  // Status options with their corresponding colors
  const statusOptions = [
    { value: 'Ready to Deploy', color: 'bg-green-500' },
    { value: 'Onsite', color: 'bg-blue-400' },
    { value: 'WFH', color: 'bg-cyan-400' },
    { value: 'Temporarily Deployed', color: 'bg-pink-500' },
    { value: 'Borrowed', color: 'bg-orange-400' },
    { value: 'Defective', color: 'bg-red-500' }
  ];
  
  useEffect(() => {
    if (isOpen) {
      fetchAvailableAssets();
      fetchCategories();
      fetchModels();
    }
  }, [isOpen]);
  
  const fetchAvailableAssets = async () => {
    setLoading(true);
    try {
      // Get assets that are available to assign (not already assigned to this or other employees)
      // The ?unassigned=true parameter will tell your backend to filter for unassigned assets
      const response = await axios.get('/api/assets?unassigned=true');
      console.log('Available assets:', response.data);
      setAssets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching available assets:', err);
      setError('Failed to load available assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

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
      assetStatus: ''
    });
    setSearchTerm('');
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
    
    return matchesSearch && matchesCategory && matchesModel && matchesStatus;
  });
  
  const handleAssignmentSuccess = () => {
    // Close both modals and reset selections
    setIsAssignModalOpen(false);
    onClose();
    setSelectedItems([]);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#25424D] rounded-lg w-full max-w-4xl p-6 text-white max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            Select Assets to Assign
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Search and Actions Row */}
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search assets..."
              className="w-full bg-[#1A3A4A] rounded-md px-10 py-2 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setSearchTerm('')}
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 ${showFilters ? 'bg-[#0075A2]' : 'bg-[#1A3A4A]'} px-3 py-2 rounded-md transition-colors`}
            >
              <FaFilter />
              <span>Filter</span>
            </button>
            
            <button 
              onClick={fetchAvailableAssets}
              className="flex items-center gap-2 bg-[#1A3A4A] px-3 py-2 rounded-md transition-colors"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            
            <button 
              onClick={() => {
                if (selectedItems.length > 0) {
                  setIsAssignModalOpen(true);
                } else {
                  alert("Please select at least one asset");
                }
              }}
              disabled={selectedItems.length === 0}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                selectedItems.length > 0 
                  ? "bg-[#0075A2] hover:bg-[#0088BC] text-white" 
                  : "bg-[#1A3A4A] text-gray-400 cursor-not-allowed"
              }`}
            >
              <FaCheck />
              <span>Assign Selected ({selectedItems.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-[#1A3A4A] rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Filter Options</h3>
              <button 
                onClick={resetFilters}
                className="text-sm text-gray-400 hover:text-white"
              >
                Reset Filters
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Category</label>
                <select
                  name="categoryID"
                  value={filters.categoryID}
                  onChange={handleFilterChange}
                  className="w-full bg-[#16282F] rounded p-2"
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
                  className="w-full bg-[#16282F] rounded p-2"
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
                  className="w-full bg-[#16282F] rounded p-2"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 rounded-md">
            <p className="text-red-300">{error}</p>
          </div>
        )}
        
        {/* Assets Table */}
        <div className="flex-1 overflow-auto bg-[#16282F] rounded-md">
          <table className="w-full text-left">
            <thead className="bg-[#1A3A4A] sticky top-0">
              <tr>
                <th className="p-3 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded accent-blue-500"
                    checked={selectedItems.length === filteredAssets.length && filteredAssets.length > 0}
                    onChange={handleSelectAll}
                    disabled={filteredAssets.length === 0}
                  />
                </th>
                <th className="p-3">Asset Name</th>
                <th className="p-3">Image</th>
                <th className="p-3">Asset Tag</th>
                <th className="p-3">Serial No</th>
                <th className="p-3">Model</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center">
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0075A2]"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-400">
                    {searchTerm || filters.categoryID || filters.modelID || filters.assetStatus 
                      ? "No assets found matching your search and filters." 
                      : "No unassigned assets available. Create assets in the Assets page first."}
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr 
                    key={asset.assetID} 
                    className="border-t border-[#273C45] hover:bg-[#1A3A4A] cursor-pointer transition-colors"
                    onClick={() => handleSelect(asset.assetID)}
                  >
                    <td className="p-3">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded accent-blue-500"
                        checked={selectedItems.includes(asset.assetID)}
                        onChange={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(asset.assetID);
                        }}
                      />
                    </td>
                    <td className="p-3 font-medium">{asset.assetName}</td>
                    <td className="p-3">
                      {asset.imagePath && (
                        <img 
                          src={`http://localhost:3001/${asset.imagePath.split('\\').pop()}`} 
                          alt={asset.assetName} 
                          className="w-10 h-10 rounded object-cover"
                          onError={(e) => {
                            console.error("Image failed to load:", asset.imagePath);
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </td>
                    <td className="p-3">{asset.assetTag}</td>
                    <td className="p-3">{asset.serialNo}</td>
                    <td className="p-3">{asset.modelName}</td>
                    <td className="p-3">{asset.categoryName}</td>
                    <td className="p-3">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Assign Asset Modal */}
      {isAssignModalOpen && (
        <AssignAssetModal 
          isOpen={isAssignModalOpen} 
          onClose={() => setIsAssignModalOpen(false)} 
          assetIds={selectedItems}
          employeeId={employeeId} 
          onSuccess={handleAssignmentSuccess} 
        />
      )}
    </div>
  );
};

export default SelectAssetsModal;