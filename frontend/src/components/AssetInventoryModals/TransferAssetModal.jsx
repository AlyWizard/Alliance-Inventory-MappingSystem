import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import axios from '../../api';

const TransferAssetModal = ({ isOpen, onClose, assetIds, currentWorkstationId, onSuccess }) => {
  // State for employees
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // State for workstations
  const [workstations, setWorkstations] = useState([]);
  const [selectedWorkstation, setSelectedWorkstation] = useState('');
  
  // State for status
  const [assetStatus, setAssetStatus] = useState('Onsite');
  
  // State for asset info
  const [assets, setAssets] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Status options
  const statusOptions = [
    { value: 'Onsite', label: 'Onsite' },
    { value: 'WFH', label: 'Work From Home' },
    { value: 'Temporarily Deployed', label: 'Temporarily Deployed' },
    { value: 'Borrowed', label: 'Borrowed' }
  ];

  // Fetch initial data when modal opens
  useEffect(() => {
    if (isOpen && assetIds.length > 0) {
      fetchEmployees();
      fetchAssets();
    }
  }, [isOpen, assetIds]);
  
  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch assets to display details
  const fetchAssets = async () => {
    try {
      const promises = assetIds.map(id => axios.get(`/api/assets/${id}`));
      const responses = await Promise.all(promises);
      setAssets(responses.map(res => res.data));
    } catch (err) {
      console.error('Error fetching asset details:', err);
    }
  };
  
  // Fetch workstations when employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      fetchWorkstations(selectedEmployee);
    } else {
      setWorkstations([]);
      setSelectedWorkstation('');
    }
  }, [selectedEmployee]);
  
  // Fetch workstations for selected employee
  const fetchWorkstations = async (empId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/employees/${empId}/workstations`);
      setWorkstations(response.data);
      
      // If workstations exist, select the first one by default
      if (response.data.length > 0) {
        setSelectedWorkstation(response.data[0].workStationID);
      } else {
        setSelectedWorkstation('');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching workstations:', err);
      setWorkstations([]);
      setSelectedWorkstation('');
      setError('Failed to load workstations. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle employee change
  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      setError('Please select an employee.');
      return;
    }
    
    if (!selectedWorkstation) {
      setError('Please select a workstation. If none are available, you may need to create one for this employee first.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Transfer assets to the new workstation
      await axios.post('/api/assets/transfer', {
        assetIds,
        fromWorkstationId: currentWorkstationId,
        toWorkstationId: selectedWorkstation,
        assetStatus
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error transferring assets:', err);
      setError('Failed to transfer assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Close and reset form
  const handleClose = () => {
    setSelectedEmployee('');
    setSelectedWorkstation('');
    setAssetStatus('Onsite');
    setError(null);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#16282F] rounded-lg w-full max-w-2xl overflow-auto max-h-[90vh]">
        <div className="p-6 border-b border-[#273C45]">
          <h2 className="text-xl font-semibold text-white">Transfer Assets</h2>
          <p className="text-gray-400 mt-1">Transfer {assetIds.length} selected asset(s) to another employee</p>
        </div>
        
        <div className="p-6">
          {/* Selected Assets Summary */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-2">Selected Assets</h3>
            <div className="bg-[#1A3A4A] p-3 rounded max-h-60 overflow-y-auto">
              {assets.map(asset => (
                <div key={asset.assetID} className="flex items-center gap-2 py-2 border-b border-[#273C45] last:border-none">
                  {asset.imagePath && (
                    <div className="w-8 h-8 rounded overflow-hidden bg-[#1F3A45] flex items-center justify-center">
                      <img 
                        src={`http://localhost:3001/uploads/assets/${asset.imagePath.split('\\').pop()}`} 
                        alt={asset.assetName} 
                        className="w-full h-full object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white">{asset.assetName}</p>
                    <p className="text-gray-400 text-xs">SN: {asset.serialNo}</p>
                  </div>
                  <div className="text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      asset.assetStatus === 'Ready to Deploy' ? 'bg-green-900 text-green-300' :
                      asset.assetStatus === 'Onsite' ? 'bg-blue-900 text-blue-300' :
                      asset.assetStatus === 'WFH' ? 'bg-cyan-900 text-cyan-300' :
                      asset.assetStatus === 'Temporarily Deployed' ? 'bg-pink-900 text-pink-300' :
                      asset.assetStatus === 'Borrowed' ? 'bg-orange-900 text-orange-300' :
                      asset.assetStatus === 'Defective' ? 'bg-red-900 text-red-300' : 'bg-gray-900 text-gray-300'
                    }`}>
                      {asset.assetStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4 flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Transfer To Employee</label>
              <select
                className="w-full bg-[#13232c] text-white p-2 rounded border border-[#273C45]"
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                disabled={loading}
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.empID} value={employee.empID}>
                    {employee.empFirstName} {employee.empLastName} ({employee.empUserName})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Destination Workstation</label>
              <select
                className="w-full bg-[#13232c] text-white p-2 rounded border border-[#273C45]"
                value={selectedWorkstation}
                onChange={(e) => setSelectedWorkstation(e.target.value)}
                disabled={!selectedEmployee || loading || workstations.length === 0}
              >
                <option value="">Select Workstation</option>
                {workstations.map((workstation) => (
                  <option key={workstation.workStationID} value={workstation.workStationID}>
                    {workstation.modelName}
                  </option>
                ))}
              </select>
              {selectedEmployee && workstations.length === 0 && (
                <p className="text-yellow-400 text-sm mt-1">
                  This employee has no workstations. Please create a workstation first.
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Set Asset Status After Transfer</label>
              <select
                className="w-full bg-[#13232c] text-white p-2 rounded border border-[#273C45]"
                value={assetStatus}
                onChange={(e) => setAssetStatus(e.target.value)}
                disabled={loading}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45]"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#38b6ff] text-white rounded"
                disabled={loading || !selectedEmployee || !selectedWorkstation}
              >
                {loading ? 
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Transferring...
                  </span> : 'Transfer Assets'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferAssetModal;