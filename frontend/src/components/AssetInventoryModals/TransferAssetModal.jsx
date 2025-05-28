import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaUser, FaBox, FaExchangeAlt } from 'react-icons/fa';
import axios from '../../api';

const TransferAssetModal = ({ isOpen, onClose, assetIds, currentWorkstationId, currentEmployee, onSuccess }) => {
  // State for workstations
  const [workstations, setWorkstations] = useState([]);
  const [selectedWorkstation, setSelectedWorkstation] = useState('');
  const [destinationWorkstationInfo, setDestinationWorkstationInfo] = useState(null);
  
  // State for transfer type
  const [transferType, setTransferType] = useState('assets'); // 'assets', 'employee', 'both'
  
  // State for status
  const [assetStatus, setAssetStatus] = useState('Onsite');
  
  // State for asset info
  const [assets, setAssets] = useState([]);
  
  // State for workstation occupancy warning
  const [showOccupancyWarning, setShowOccupancyWarning] = useState(false);
  const [occupiedByEmployee, setOccupiedByEmployee] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Transfer type options
  const transferTypeOptions = [
    { value: 'assets', label: 'Assets Only', icon: FaBox, description: 'Transfer only the selected assets' },
    { value: 'employee', label: 'Employee Only', icon: FaUser, description: 'Transfer only the employee to new workstation' },
    { value: 'both', label: 'Both Employee & Assets', icon: FaExchangeAlt, description: 'Transfer both employee and assets together' }
  ];
  
  // Status options
  const statusOptions = [
    { value: 'Onsite', label: 'Onsite' },
    { value: 'WFH', label: 'Work From Home' },
    { value: 'Temporarily Deployed', label: 'Temporarily Deployed' },
    { value: 'Borrowed', label: 'Borrowed' }
  ];

  // Fetch initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWorkstations();
      if (assetIds && assetIds.length > 0) {
        fetchAssets();
      }
      // Reset states
      setSelectedWorkstation('');
      setShowOccupancyWarning(false);
      setOccupiedByEmployee(null);
      setError(null);
    }
  }, [isOpen, assetIds]);
  
  // Fetch all workstations
  const fetchWorkstations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/workstations');
      // Filter out the current workstation from the list
      const filteredWorkstations = response.data.filter(ws => ws.workStationID !== currentWorkstationId);
      setWorkstations(filteredWorkstations);
      setError(null);
    } catch (err) {
      console.error('Error fetching workstations:', err);
      setError('Failed to load workstations. Please try again.');
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
  
  // Check workstation occupancy when workstation is selected
  useEffect(() => {
    if (selectedWorkstation && (transferType === 'employee' || transferType === 'both')) {
      checkWorkstationOccupancy(selectedWorkstation);
    } else {
      setShowOccupancyWarning(false);
      setOccupiedByEmployee(null);
    }
  }, [selectedWorkstation, transferType]);
  
  // Check if selected workstation is occupied
  const checkWorkstationOccupancy = async (workstationId) => {
    try {
      const response = await axios.get(`/api/workstations/${workstationId}`);
      const workstationInfo = response.data;
      setDestinationWorkstationInfo(workstationInfo);
      
      // Check if workstation has an assigned employee
      if (workstationInfo.empID && workstationInfo.empFirstName) {
        setOccupiedByEmployee({
          empID: workstationInfo.empID,
          empFirstName: workstationInfo.empFirstName,
          empLastName: workstationInfo.empLastName,
          empUserName: workstationInfo.empUserName
        });
        setShowOccupancyWarning(true);
      } else {
        setOccupiedByEmployee(null);
        setShowOccupancyWarning(false);
      }
    } catch (err) {
      console.error('Error checking workstation occupancy:', err);
      setError('Failed to check workstation status.');
    }
  };
  
  // Handle workstation change
  const handleWorkstationChange = (e) => {
    setSelectedWorkstation(e.target.value);
  };
  
  // Handle transfer type change
  const handleTransferTypeChange = (type) => {
    setTransferType(type);
    setShowOccupancyWarning(false);
    setOccupiedByEmployee(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedWorkstation) {
      setError('Please select a destination workstation.');
      return;
    }
    
    // If transferring assets only and no assets selected
    if (transferType === 'assets' && (!assetIds || assetIds.length === 0)) {
      setError('No assets selected for transfer.');
      return;
    }
    
    // If transferring employee and no current employee
    if ((transferType === 'employee' || transferType === 'both') && !currentEmployee) {
      setError('No employee information available for transfer.');
      return;
    }
    
    // Show confirmation if workstation is occupied and employee transfer is involved
    if (showOccupancyWarning && !window.confirm(
      `This workstation is occupied by ${occupiedByEmployee.empFirstName} ${occupiedByEmployee.empLastName} (${occupiedByEmployee.empUserName}). ` +
      `This will automatically unassign this employee if you proceed. Are you sure you want to continue?`
    )) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare transfer data based on transfer type
      const transferData = {
        toWorkstationId: selectedWorkstation,
        transferType: transferType
      };
      
      // Add current workstation and employee info
      if (currentWorkstationId) {
        transferData.fromWorkstationId = currentWorkstationId;
      }
      
      if (currentEmployee) {
        transferData.currentEmployeeId = currentEmployee.empID;
      }
      
      // Add assets if transferring assets
      if (transferType === 'assets' || transferType === 'both') {
        transferData.assetIds = assetIds;
        transferData.assetStatus = assetStatus;
      }
      
      // Call the appropriate API endpoint
      let response;
      switch (transferType) {
        case 'assets':
          response = await axios.post('/api/workstations/transfer-assets', transferData);
          break;
        case 'employee':
          response = await axios.post('/api/workstations/transfer-employee', transferData);
          break;
        case 'both':
          response = await axios.post('/api/workstations/transfer-both', transferData);
          break;
        default:
          throw new Error('Invalid transfer type');
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      handleClose();
    } catch (err) {
      console.error('Error during transfer:', err);
      setError(err.response?.data?.error || 'Failed to complete transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Close and reset form
  const handleClose = () => {
    setSelectedWorkstation('');
    setTransferType('assets');
    setAssetStatus('Onsite');
    setShowOccupancyWarning(false);
    setOccupiedByEmployee(null);
    setDestinationWorkstationInfo(null);
    setError(null);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#16282F] rounded-lg w-full max-w-3xl overflow-auto max-h-[90vh]">
        <div className="p-6 border-b border-[#273C45]">
          <h2 className="text-xl font-semibold text-white">Transfer to Workstation</h2>
          <p className="text-gray-400 mt-1">
            Transfer {transferType === 'employee' ? 'employee' : 
                    transferType === 'both' ? `employee and ${assetIds?.length || 0} asset(s)` : 
                    `${assetIds?.length || 0} selected asset(s)`} to another workstation
          </p>
        </div>
        
        <div className="p-6">
          {/* Transfer Type Selection */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">What would you like to transfer?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {transferTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      transferType === option.value
                        ? 'border-[#38b6ff] bg-[#38b6ff] bg-opacity-10'
                        : 'border-[#273C45] bg-[#1A3A4A] hover:border-[#38b6ff] hover:border-opacity-50'
                    }`}
                    onClick={() => handleTransferTypeChange(option.value)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${transferType === option.value ? 'text-[#38b6ff]' : 'text-gray-400'}`} />
                      <span className={`font-medium ${transferType === option.value ? 'text-[#38b6ff]' : 'text-white'}`}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Employee Info - shown when transferring employee */}
          {(transferType === 'employee' || transferType === 'both') && currentEmployee && (
            <div className="mb-6">
              <h3 className="text-white font-medium mb-2">Current Employee</h3>
              <div className="bg-[#1A3A4A] p-3 rounded flex items-center gap-3">
                <div className="w-10 h-10 bg-[#273C45] rounded-full flex items-center justify-center">
                  <FaUser className="text-gray-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {currentEmployee.empFirstName} {currentEmployee.empLastName}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {currentEmployee.empUserName} • {currentEmployee.empDept}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Assets Summary - shown when transferring assets */}
          {(transferType === 'assets' || transferType === 'both') && assets && assets.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-medium mb-2">Selected Assets ({assets.length})</h3>
              <div className="bg-[#1A3A4A] p-3 rounded max-h-40 overflow-y-auto">
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
                      <p className="text-white text-sm">{asset.assetName}</p>
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
          )}

          {/* Workstation Occupancy Warning */}
          {showOccupancyWarning && occupiedByEmployee && (
            <div className="bg-yellow-600 bg-opacity-20 text-yellow-100 p-4 rounded mb-4 flex items-start gap-3">
              <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Workstation Occupied</p>
                <p className="text-sm mt-1">
                  This workstation is currently occupied by{' '}
                  <span className="font-medium">
                    {occupiedByEmployee.empFirstName} {occupiedByEmployee.empLastName} ({occupiedByEmployee.empUserName})
                  </span>
                  . This employee will be automatically unassigned from this workstation if you proceed.
                </p>
              </div>
            </div>
          )}
          
          {/* General Error Display */}
          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4 flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Destination Workstation Selection */}
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Destination Workstation</label>
              <select
                className="w-full bg-[#13232c] text-white p-3 rounded border border-[#273C45]"
                value={selectedWorkstation}
                onChange={handleWorkstationChange}
                disabled={loading}
              >
                <option value="">Select Destination Workstation</option>
                {workstations.map((workstation) => (
                  <option key={workstation.workStationID} value={workstation.workStationID}>
                    {workstation.modelName} 
                    {workstation.empFirstName ? ` - Occupied by ${workstation.empFirstName} ${workstation.empLastName}` : ' - Available'}
                  </option>
                ))}
              </select>
              {workstations.length === 0 && (
                <p className="text-yellow-400 text-sm mt-1">
                  No other workstations available.
                </p>
              )}
            </div>
            
            {/* Asset Status Selection - only shown when transferring assets */}
            {(transferType === 'assets' || transferType === 'both') && (
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Set Asset Status After Transfer</label>
                <select
                  className="w-full bg-[#13232c] text-white p-3 rounded border border-[#273C45]"
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
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 bg-[#13232c] text-white rounded border border-[#273C45] hover:bg-[#1a3a4a] transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#38b6ff] text-white rounded hover:bg-[#5bc2ff] transition-colors disabled:opacity-50"
                disabled={loading || !selectedWorkstation || workstations.length === 0}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  `Transfer ${transferType === 'employee' ? 'Employee' : 
                           transferType === 'both' ? 'Employee & Assets' : 'Assets'}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferAssetModal;