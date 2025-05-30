import React, { useState, useEffect } from 'react';
import { FaSearch, FaExclamationTriangle, FaFilter } from 'react-icons/fa';
import axios from '../../api';

const SelectAssetsModal = ({ isOpen, onClose, employeeId, onSuccess }) => {
  // State for available assets
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for selected assets
  const [selectedAssets, setSelectedAssets] = useState([]);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    categoryID: '',
    modelID: '',
    assetStatus: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // State for categories and models (for filter dropdowns)
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  
  // State for asset status after assignment
  const [assetStatus, setAssetStatus] = useState('Onsite');
  
  // Status options with their corresponding colors (excluding borrowed since we can't assign borrowed assets)
  const statusOptions = [
    { value: 'Ready to Deploy', color: 'bg-green-500' },
    { value: 'Onsite', color: 'bg-blue-400' },
    { value: 'WFH', color: 'bg-cyan-400' },
    { value: 'Temporarily Deployed', color: 'bg-pink-500' },
    { value: 'Defective', color: 'bg-red-500' }
  ];

  // Available status options for filtering (including borrowed so user can see why assets are excluded)
  const filterStatusOptions = [
    { value: 'Ready to Deploy', color: 'bg-green-500' },
    { value: 'Onsite', color: 'bg-blue-400' },
    { value: 'WFH', color: 'bg-cyan-400' },
    { value: 'Temporarily Deployed', color: 'bg-pink-500' },
    { value: 'Borrowed', color: 'bg-orange-400' },
    { value: 'Defective', color: 'bg-red-500' }
  ];
  
  // Fetch initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableAssets();
      fetchCategories();
      fetchModels();
    } else {
      // Reset state when modal closes
      setSelectedAssets([]);
      setSearchTerm('');
      setFilters({
        categoryID: '',
        modelID: '',
        assetStatus: ''
      });
      setShowFilters(false);
      setError(null);
    }
  }, [isOpen, employeeId]);
  
  // Fetch available (unassigned and non-borrowed) assets from API
  const fetchAvailableAssets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/assets');
      console.log('All assets:', response.data);
      
      // Filter assets that are:
      // 1. Not assigned to any workstation (workStationID === null)
      // 2. Not borrowed (assetStatus !== 'Borrowed' AND isBorrowed !== true)
      // 3. Not defective (optional - you might want to allow defective assets to be assigned for repair)
      const assignableAssets = response.data.filter(asset => {
        const isUnassigned = asset.workStationID === null;
        const isNotBorrowed = asset.assetStatus !== 'Borrowed' && !asset.isBorrowed;
        
        console.log(`Asset ${asset.assetTag}: unassigned=${isUnassigned}, notBorrowed=${isNotBorrowed}, status=${asset.assetStatus}, isBorrowed=${asset.isBorrowed}`);
        
        return isUnassigned && isNotBorrowed;
      });
      
      console.log('Assignable assets:', assignableAssets);
      setAvailableAssets(assignableAssets);
      setError(null);
    } catch (err) {
      console.error('Error fetching available assets:', err);
      setError('Failed to load available assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch categories for filter dropdown
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch models for filter dropdown
  const fetchModels = async () => {
    try {
      const response = await axios.get('/api/models');
      setModels(response.data);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };
  
  // Handle checkbox selection
  const handleSelect = (assetId) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };
  
  // Handle asset assignment
  const handleAssignAssets = async () => {
    if (selectedAssets.length === 0) {
      setError('Please select at least one asset to assign.');
      return;
    }
    
    // Validate that selected assets are still assignable
    const selectedAssetDetails = availableAssets.filter(asset => 
      selectedAssets.includes(asset.assetID)
    );
    
    const borrowedSelected = selectedAssetDetails.filter(asset => 
      asset.assetStatus === 'Borrowed' || asset.isBorrowed
    );
    
    const assignedSelected = selectedAssetDetails.filter(asset => 
      asset.workStationID !== null
    );
    
    if (borrowedSelected.length > 0) {
      setError(`Cannot assign borrowed assets: ${borrowedSelected.map(a => a.assetTag).join(', ')}`);
      return;
    }
    
    if (assignedSelected.length > 0) {
      setError(`Cannot assign already assigned assets: ${assignedSelected.map(a => a.assetTag).join(', ')}`);
      return;
    }
    
    setLoading(true);
    try {
      const assignmentData = {
        selectedAssetIds: selectedAssets,
        assetStatus: assetStatus,
        employeeId: employeeId
      };
      
      console.log('Assignment data:', assignmentData);
      
      if (onSuccess) {
        onSuccess(assignmentData);
      }
      
      onClose();
    } catch (err) {
      console.error('Error preparing asset assignment:', err);
      setError('Failed to prepare asset assignment. Please try again.');
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
      assetStatus: ''
    });
    setSearchTerm('');
  };
  
  // Filter assets based on search and filters
  const filteredAssets = availableAssets.filter(asset => {
    // Search filter
    const matchesSearch = (
      asset.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.categoryType?.toLowerCase().includes(searchTerm.toLowerCase())
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
  
  // Get status color class
  const getStatusColorClass = (status) => {
    const statusOption = filterStatusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'bg-gray-500';
  };
  
  // Select all filtered assets
  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(asset => asset.assetID));
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#16282F] rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col text-white">
        <div className="flex justify-between items-center p-6 border-b border-[#273C45]">
          <h2 className="text-xl font-semibold">Select Assets to Assign</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6 border-b border-[#273C45]">
          {/* Asset Status Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-3">Asset Status After Assignment</h3>
            <select
              value={assetStatus}
              onChange={(e) => setAssetStatus(e.target.value)}
              className="w-full bg-[#13232c] text-white p-2 rounded-md border border-[#273C45]"
              disabled={loading}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Note: Only unassigned and non-borrowed assets are shown for assignment
            </p>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search assets..."
                  className="bg-[#13232c] text-white pl-10 pr-4 py-2 rounded-md border border-[#273C45] w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-md border border-[#273C45] ${showFilters ? 'bg-[#38b6ff] text-white' : 'bg-[#13232c] text-gray-300'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="w-3 h-3" />
                <span>Filters</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400">
                {selectedAssets.length} of {filteredAssets.length} assets selected
              </span>
            </div>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 bg-[#13232c] p-4 rounded-md border border-[#273C45]">
              <div className="flex justify-between mb-3">
                <h3 className="font-medium">Filter Options</h3>
                <button
                  className="text-sm text-gray-400 hover:text-white"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Category</label>
                  <select
                    name="categoryID"
                    value={filters.categoryID}
                    onChange={handleFilterChange}
                    className="w-full bg-[#1F3A45] rounded p-2 appearance-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.categoryID} value={category.categoryID}>
                        {category.categoryType}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Model</label>
                  <select
                    name="modelID"
                    value={filters.modelID}
                    onChange={handleFilterChange}
                    className="w-full bg-[#1F3A45] rounded p-2 appearance-none"
                  >
                    <option value="">All Models</option>
                    {models.map(model => (
                      <option key={model.modelID} value={model.modelID}>
                        {model.modelName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Status</label>
                  <select
                    name="assetStatus"
                    value={filters.assetStatus}
                    onChange={handleFilterChange}
                    className="w-full bg-[#1F3A45] rounded p-2 appearance-none"
                  >
                    <option value="">All Statuses</option>
                    {filterStatusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mt-4 flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#38b6ff]"></div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-center">
                No assignable assets found matching your criteria.
                <br />
                <span className="text-sm">
                  (Borrowed and already assigned assets are excluded)
                </span>
              </p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-[#13232c]">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#38b6ff]"
                      checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Image</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset Tag</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Serial Number</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Model</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr 
                    key={asset.assetID} 
                    className="border-t border-[#273C45] hover:bg-[#1a2d35] cursor-pointer"
                    onClick={() => handleSelect(asset.assetID)}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#38b6ff]"
                        checked={selectedAssets.includes(asset.assetID)}
                        onChange={() => {}} // We handle the change on the row click
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{asset.assetName || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {asset.imagePath ? (
                        <div className="w-10 h-10 rounded overflow-hidden bg-[#1F3A45] flex items-center justify-center">
                          <img 
                            src={`http://localhost:3001/uploads/assets/${asset.imagePath.split('\\').pop()}`} 
                            alt={asset.assetName} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
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
                    </td>
                    <td className="py-3 px-4">{asset.assetTag}</td>
                    <td className="py-3 px-4">{asset.serialNo || 'N/A'}</td>
                    <td className="py-3 px-4">{asset.modelName || 'N/A'}</td>
                    <td className="py-3 px-4">{asset.categoryType || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColorClass(asset.assetStatus)}`}></div>
                        <span>{asset.assetStatus}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="p-4 border-t border-[#273C45] flex justify-end">
          <button 
            onClick={onClose}
            className="bg-[#13232c] text-white px-4 py-2 rounded-md border border-[#273C45] mr-2"
          >
            Cancel
          </button>
          <button
            className="bg-[#38b6ff] text-white px-4 py-2 rounded-md hover:bg-[#2a9fd9]"
            onClick={handleAssignAssets}
            disabled={loading || selectedAssets.length === 0}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Processing...</span>
              </span>
            ) : `Assign ${selectedAssets.length} Asset${selectedAssets.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectAssetsModal;