import React, { useState, useEffect } from 'react';
import { FaSearch, FaSyncAlt, FaPlus, FaFileExport, FaTrash, FaEdit, FaFilter, FaDesktop } from 'react-icons/fa';
import axios from '../api';
import AddWorkstationModal from '../components/WorkstationModals/AddWorkstationModal';
import EditWorkstationModal from '../components/WorkstationModals/EditWorkstationModal';

const Workstations = () => {
  // State for workstations data
  const [workstations, setWorkstations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for employees (for dropdown)
  const [employees, setEmployees] = useState([]);

  // State for selected items
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentWorkstation, setCurrentWorkstation] = useState(null);
  
  // State for filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    empID: '',
    hasAssets: ''
  });

  // Fetch workstations and related data on component mount
  useEffect(() => {
    fetchWorkstations();
    fetchEmployees();
  }, []);

  // Fetch workstations from API
  const fetchWorkstations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/workstations');
      setWorkstations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching workstations:', err);
      setError(`Failed to load workstations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
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
    if (selectedItems.length === filteredWorkstations.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredWorkstations.map(workstation => workstation.workStationID));
    }
  };

  // Handle bulk workstation deletion with asset assignment check
  const handleBulkDelete = async () => {
    if (!selectedItems.length) return;
    
    try {
      // Check if any selected workstations have assigned assets
      const workstationsWithAssets = [];
      
      for (const workstationId of selectedItems) {
        const response = await axios.get(`/api/workstations/${workstationId}/assets`);
        if (response.data.length > 0) {
          const workstation = workstations.find(w => w.workStationID === workstationId);
          if (workstation) {
            workstationsWithAssets.push(workstation);
          }
        }
      }
      
      if (workstationsWithAssets.length > 0) {
        const workstationNames = workstationsWithAssets.map(ws => ws.modelName).join(', ');
        setError(`Cannot delete workstations with assigned assets: ${workstationNames}. Please unassign all assets first.`);
        return;
      }
      
      if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected workstation(s)?`)) {
        setLoading(true);
        try {
          // Delete each selected workstation
          await Promise.all(selectedItems.map(id => 
            axios.delete(`/api/workstations/${id}`)
          ));
          
          // Refresh workstations and clear selection
          fetchWorkstations();
          setSelectedItems([]);
        } catch (err) {
          console.error('Error deleting workstations:', err);
          setError('Failed to delete workstations. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error checking workstation assets:', err);
      setError('Failed to check workstation assets. Please try again.');
    }
  };

  // Handle single workstation deletion
  const handleSingleDelete = async (id) => {
    try {
      // Check if workstation has assigned assets
      const response = await axios.get(`/api/workstations/${id}/assets`);
      
      if (response.data.length > 0) {
        const workstation = workstations.find(w => w.workStationID === id);
        setError(`Cannot delete workstation "${workstation.modelName}" because it has assigned assets. Please unassign all assets first.`);
        return;
      }
      
      if (window.confirm('Are you sure you want to delete this workstation?')) {
        setLoading(true);
        try {
          await axios.delete(`/api/workstations/${id}`);
          // Refresh workstations and remove from selected items if present
          fetchWorkstations();
          setSelectedItems(selectedItems.filter(item => item !== id));
        } catch (err) {
          console.error('Error deleting workstation:', err);
          setError('Failed to delete workstation. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error checking workstation assets:', err);
      setError('Failed to check workstation assets. Please try again.');
    }
  };

  // Handle edit workstation
  const handleEdit = async (workstationId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/workstations/${workstationId}`);
      setCurrentWorkstation(response.data);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error fetching workstation details:', err);
      setError('Failed to fetch workstation details. Please try again.');
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
      empID: '',
      hasAssets: ''
    });
    setSearchTerm('');
    setFilterOpen(false);
  };

  // Filter workstations based on search and filters
  const filteredWorkstations = workstations.filter(workstation => {
    // Search filter
    const matchesSearch = (
      workstation.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workstation.empFirstName && workstation.empFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (workstation.empLastName && workstation.empLastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Employee filter
    const matchesEmployee = filters.empID === '' || 
      workstation.empID?.toString() === filters.empID;
    
    // Has assets filter
    const matchesHasAssets = filters.hasAssets === '' || 
      (filters.hasAssets === 'yes' && workstation.assetCount > 0) ||
      (filters.hasAssets === 'no' && (workstation.assetCount === 0 || workstation.assetCount === null));
    
    return matchesSearch && matchesEmployee && matchesHasAssets;
  });

  // Handle successful workstation addition
  const handleWorkstationAdded = (newWorkstation) => {
    fetchWorkstations(); // Refresh the workstations list
  };

  // Handle successful workstation update
  const handleWorkstationUpdated = (updatedWorkstation) => {
    fetchWorkstations(); // Refresh the workstations list
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Export workstations to CSV
  const exportToCSV = () => {
    // Prepare data for export
    const csvData = filteredWorkstations.map(workstation => ({
      'Workstation Name': workstation.modelName || '',
      'Employee': workstation.empFirstName && workstation.empLastName ? 
                 `${workstation.empFirstName} ${workstation.empLastName}` : 'Unassigned',
      'Asset Count': workstation.assetCount || '0',
      'Date Created': formatDate(workstation.created_at)
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
    a.download = `workstations_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <div className="px-4 mb-3 text-gray-400 font-medium">
          Inventories
        </div>

        {/* Inventories Container */}
        <div className="mx-4 bg-[#16282F] rounded-md mb-6 border border-[#273C45] overflow-hidden">
          {/* Main Menu Items */}
          <div className="p-2 space-y-1">
            {/* Employees */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/employees'}>
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
            
            {/* Workstations (Active) */}
            <div className="bg-[#38b6ff] text-white rounded flex items-center gap-2 p-2">
              <FaDesktop className="w-5 h-5" />
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
          <h1 className="text-xl font-semibold">Workstations</h1>
          <div className="flex gap-2 items-center">
            {/* Refresh Button */}
            <button 
              className="bg-[#13232c] border border-[#273C45] rounded-md w-8 h-8 flex items-center justify-center"
              onClick={fetchWorkstations}
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
            <div className="grid grid-cols-2 gap-4">
              {/* Employee Filter */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Employee</label>
                <select
                  name="empID"
                  value={filters.empID}
                  onChange={handleFilterChange}
                  className="w-full bg-[#1F3A45] rounded p-2"
                >
                  <option value="">All Employees</option>
                  {employees.map(employee => (
                    <option key={employee.empID} value={employee.empID}>
                      {employee.empFirstName} {employee.empLastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Has Assets Filter */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Has Assets</label>
                <select
                  name="hasAssets"
                  value={filters.hasAssets}
                  onChange={handleFilterChange}
                  className="w-full bg-[#1F3A45] rounded p-2"
                >
                  <option value="">All</option>
                  <option value="yes">Has Assets</option>
                  <option value="no">No Assets</option>
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
        {workstations.length === 0 && !loading && !error && (
          <div className="py-8 text-center bg-[#16282F] rounded-md p-6">
            <FaDesktop className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-400 mb-4">No workstations found. Click the Add button to create your first workstation.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 bg-[#0075A2] hover:bg-[#0088BC] text-white py-2 px-6 rounded-md"
            >
              Add Your First Workstation
            </button>
          </div>
        )}
        
        {/* Table */}
        {workstations.length > 0 && (
          <div className="bg-[#16282F] rounded-md overflow-hidden">
            {/* Table Header */}
            <div className="bg-[#13232c] grid grid-cols-6 py-3 px-4 text-gray-300">
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  className="w-4 h-4 bg-transparent border-gray-600 accent-[#38b6ff]"
                  checked={selectedItems.length === filteredWorkstations.length && filteredWorkstations.length > 0}
                  onChange={handleSelectAll}
                  disabled={filteredWorkstations.length === 0}
                />
              </div>
              <div>Workstation Name</div>
              <div>Employee</div>
              <div>Department</div>
              <div>Asset Count</div>
              <div className="text-center">Actions</div>
            </div>
            
            {/* Table Rows */}
            {filteredWorkstations.length === 0 ? (
              <div className="py-4 px-4 text-center text-gray-400">
                {loading ? 'Loading workstations...' : 'No workstations found matching your filters.'}
              </div>
            ) : (
              filteredWorkstations.map((workstation) => (
                <div 
                  key={workstation.workStationID} 
                  className="grid grid-cols-6 py-3 px-4 border-b border-[#1e2d36] hover:bg-[#182a35] transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 bg-transparent border-gray-600 accent-[#38b6ff]"
                      checked={selectedItems.includes(workstation.workStationID)}
                      onChange={() => handleSelect(workstation.workStationID)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <FaDesktop className="text-[#38b6ff]" />
                      <span>{workstation.modelName}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Created: {formatDate(workstation.created_at)}
                    </div>
                  </div>
                  <div>
                    {workstation.empFirstName && workstation.empLastName ? (
                      <div>
                        {workstation.empFirstName} {workstation.empLastName}
                        <div className="text-xs text-gray-400 mt-1">
                          {workstation.empUserName}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </div>
                  <div>
                    {workstation.empDept || <span className="text-gray-400">N/A</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        (workstation.assetCount && workstation.assetCount > 0) 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {workstation.assetCount || 0}
                      </div>
                      <span>assets</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <button 
                      onClick={() => handleEdit(workstation.workStationID)}
                      className="text-[#38b6ff] hover:text-[#5bc2ff]"
                      title="Edit workstation"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleSingleDelete(workstation.workStationID)}
                      className={`text-[#ff3e4e] hover:text-[#ff6b78] ${workstation.assetCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={workstation.assetCount > 0 ? "Cannot delete workstation with assets" : "Delete workstation"}
                      disabled={workstation.assetCount > 0}
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

      {/* Add Workstation Modal */}
      <AddWorkstationModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        employees={employees}
        onSuccess={(newWorkstation) => {
          handleWorkstationAdded(newWorkstation);
          setIsAddModalOpen(false);
        }} 
      />

      {/* Edit Workstation Modal */}
      {currentWorkstation && (
        <EditWorkstationModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          workstation={currentWorkstation}
          employees={employees}
          onSuccess={(updatedWorkstation) => {
            handleWorkstationUpdated(updatedWorkstation);
            setIsEditModalOpen(false);
          }} 
        />
      )}
    </div>
  );
};

export default Workstations;