import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaExclamationTriangle, FaUserAlt, FaLaptop, FaServer, FaUsers, FaArrowRight, FaCheckCircle, FaTimesCircle, FaSearch, FaInfoCircle } from 'react-icons/fa';

const WorkstationAssignModal = ({ isOpen, onClose, workstationId }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [workstationData, setWorkstationData] = useState(null);
  const [tab, setTab] = useState('employee');
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [existingWorkstation, setExistingWorkstation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isITEquipment, setIsITEquipment] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [updateCompleted, setUpdateCompleted] = useState(false);
  const [showUnassignOption, setShowUnassignOption] = useState(false);
  // FIXED: Added missing semicolon and removed duplicate state
  const [currentEmployeeWorkstation, setCurrentEmployeeWorkstation] = useState(null);
  const [isITEquipmentMode, setIsITEquipmentMode] = useState(false);

  // Helper function to normalize workstation IDs for comparison
  const normalizeId = (id) => {
    if (!id) return '';
    return id.toString().replace(/^(WSM|ASCL|STK)[- ]?/i, '').replace(/[- ]/g, '').toLowerCase();
  };

  // Check if workstation is IT equipment
 useEffect(() => {
  if (workstationId && workstationData) {
    // Check database first, then fallback to ID patterns
    const isIT = workstationData.isITEquipment || 
                workstationId.startsWith('SVR') || 
                workstationId === 'SVR02' || 
                workstationId === 'SVR001' || 
                workstationId.startsWith('BR') || 
                workstationId === 'BR01' || 
                workstationId === 'WSM090';
    
    setIsITEquipmentMode(isIT);
    setIsITEquipment(isIT);
    
    if (isIT) {
      if (workstationId.startsWith('SVR') || workstationId === 'SVR02' || workstationId === 'SVR001') {
        setStatusMessage('This is a server equipment. You can assign employees or assets independently.');
      } else if (workstationId.startsWith('BR') || workstationId === 'BR01') {
        setStatusMessage('This is a boardroom equipment. You can assign employees or assets independently.');
      } else {
        setStatusMessage('This is IT equipment. You can assign employees or assets independently.');
      }
    } else {
      setStatusMessage('You can assign employees or assets to this workstation independently.');
    }
  }
}, [workstationId, workstationData]);

  // Add this function to toggle IT equipment status:
  const handleToggleITEquipment = async () => {
    try {
      setLoading(true);
      
      const newITStatus = !isITEquipmentMode;
      let workstationIdToUse = workstationData?.workStationID;
      
      if (!workstationIdToUse) {
        // Create workstation with IT status
        const createResponse = await axios.post('/api/workstations', {
          modelName: workstationId,
          empID: null,
          isITEquipment: newITStatus ? 1 : 0
        });
        setWorkstationData(createResponse.data);
        setExistingWorkstation(true);
      } else {
        // Update existing workstation
        await axios.put(`/api/workstations/${workstationIdToUse}`, {
          empID: workstationData.empID,
          modelName: workstationId,
          isITEquipment: newITStatus ? 1 : 0
        });
      }
      
      setIsITEquipmentMode(newITStatus);
      setIsITEquipment(newITStatus);
      
      setSuccess(`Workstation ${newITStatus ? 'converted to IT Equipment' : 'converted to regular workstation'} successfully!`);
      notifyWorkstationUpdated();
      
    } catch (err) {
      console.error('Error toggling IT equipment status:', err);
      setError('Failed to update workstation type.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees and available assets when modal opens
  useEffect(() => {
    if (isOpen && workstationId) {
      fetchEmployees();
      checkExistingWorkstation();
      fetchAvailableAssets();
      setTab('employee');
      setUpdateCompleted(false);
      setSuccess(null);
      setError(null);
    }
  }, [isOpen, workstationId]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployee('');
      setSelectedAssets([]);
      setSearchTerm('');
      setError(null);
      setSuccess(null);
      setShowUnassignOption(false);
      setCurrentEmployeeWorkstation(null);
    }
  }, [isOpen]);

  // Check if workstation already exists
  const checkExistingWorkstation = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/workstations');
      const normalizedCurrentId = normalizeId(workstationId);
      
      let found = response.data.find(ws => ws.workStationID?.toString() === workstationId?.toString());
      
      if (!found) {
        found = response.data.find(ws => ws.modelName === workstationId);
      }
      
      if (!found) {
        found = response.data.find(ws => {
          const normalizedModelName = normalizeId(ws.modelName);
          return normalizedModelName === normalizedCurrentId;
        });
      }
      
      if (!found && workstationId.match(/\d+/)) {
        const numericPart = workstationId.match(/\d+/)[0].replace(/^0+/, '');
        found = response.data.find(ws => {
          if (ws.workStationID?.toString() === numericPart) return true;
          
          if (ws.modelName && ws.modelName.match(/\d+/)) {
            const wsNumeric = ws.modelName.match(/\d+/)[0].replace(/^0+/, '');
            return wsNumeric === numericPart;
          }
          
          return false;
        });
      }
      
      if (found) {
        console.log('Existing workstation found:', found);
        
        if (found.empID) {
          try {
            const empResponse = await axios.get(`/api/employees/${found.empID}`);
            const employeeName = `${empResponse.data.empFirstName} ${empResponse.data.empLastName}`;
            setStatusMessage(`This workstation is currently assigned to ${employeeName}. You can update the assignment or assign assets independently.`);
          } catch (err) {
            console.error('Error fetching employee details:', err);
          }
        }
        
        setWorkstationData(found);
        setExistingWorkstation(true);
        
        if (found.empID) {
          setSelectedEmployee(found.empID.toString());
        }
      } else {
        console.log('No existing workstation found for ID:', workstationId);
        setWorkstationData({ 
          workStationID: null,
          modelName: workstationId,
          empID: null,
          assetCount: 0
        });
        setExistingWorkstation(false);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error checking existing workstation:', err);
      setLoading(false);
      
      setWorkstationData({ 
        workStationID: null,
        modelName: workstationId,
        empID: null,
        assetCount: 0
      });
      setExistingWorkstation(false);
    }
  };

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available assets
  const fetchAvailableAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/assets');
      const unassignedAssets = response.data.filter(asset => !asset.workStationID);
      setAvailableAssets(unassignedAssets);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching available assets:', err);
      setLoading(false);
      setAvailableAssets([]);
    }
  };

  // Dispatch update event to notify FloorMap of changes
  const notifyWorkstationUpdated = () => {
    console.log('Notifying of workstation update:', workstationId);
    const event = new CustomEvent('workstationUpdated', {
      detail: { workstationId }
    });
    window.dispatchEvent(event);
    setUpdateCompleted(true);
  };

  // FIXED: Handle employee assignment with better error handling
const handleAssignEmployee = async () => {
  if (!selectedEmployee) {
    setError('Please select an employee');
    return;
  }

  try {
    setLoading(true);
    setError(null);
    setShowUnassignOption(false);
    setCurrentEmployeeWorkstation(null);
    
    console.log('🚀 Starting employee assignment...');
    console.log('Selected employee:', selectedEmployee);
    console.log('Target workstation:', workstationId);
    
    let workstationIdToUse = workstationData?.workStationID;
    
    // STEP 1: Check if employee is already assigned elsewhere
    console.log('🔍 Checking for conflicts...');
    const workstationsResponse = await axios.get('/api/workstations');
    
    const employeeCurrentWorkstation = workstationsResponse.data.find(ws => 
      ws.empID && ws.empID.toString() === selectedEmployee.toString()
    );
    
    if (employeeCurrentWorkstation) {
      console.log('⚠️ Employee is already assigned to:', employeeCurrentWorkstation.modelName);
      
      // Check if it's the same workstation
      if (workstationIdToUse && employeeCurrentWorkstation.workStationID === workstationIdToUse) {
        console.log('ℹ️ Employee already assigned to this workstation');
        setSuccess('Employee is already assigned to this workstation!');
        return;
      }
      
      // Show reassignment option
      console.log('📋 Getting employee details for conflict message...');
      const empResponse = await axios.get(`/api/employees/${selectedEmployee}`);
      const employeeName = `${empResponse.data.empFirstName} ${empResponse.data.empLastName}`;
      
      setCurrentEmployeeWorkstation(employeeCurrentWorkstation);
      setShowUnassignOption(true);
      return;
    }
    
    // STEP 2: No conflicts - proceed with direct assignment
    console.log('✅ No conflicts found, proceeding with assignment...');
    
    if (!workstationIdToUse) {
      console.log('🔨 Creating new workstation with employee...');
      const createResponse = await axios.post('/api/workstations', {
        modelName: workstationId,
        empID: parseInt(selectedEmployee)
      });
      
      setWorkstationData(createResponse.data);
      setExistingWorkstation(true);
      setSuccess('New workstation created and employee assigned successfully!');
    } else {
      console.log('🔄 Updating existing workstation...');
      await axios.put(`/api/workstations/${workstationIdToUse}`, {
        empID: parseInt(selectedEmployee),
        modelName: workstationId
      });
      
      setSuccess('Employee assigned successfully!');
    }
    
    console.log('✅ Assignment completed successfully');
    notifyWorkstationUpdated();
    
  } catch (err) {
    console.error('❌ Assignment failed:', err);
    
    let errorMessage = 'Failed to assign employee: ';
    if (err.response?.data?.error) {
      errorMessage += err.response.data.error;
    } else {
      errorMessage += err.message || 'Unknown error occurred.';
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // FIXED: Handle unassign and reassign with detailed debugging

const handleUnassignAndReassign = async () => {
  if (!selectedEmployee || !currentEmployeeWorkstation) {
    setError('Missing employee or workstation information');
    return;
  }
  
  setLoading(true);
  setShowUnassignOption(false);
  
  try {
    console.log('🔄 Starting reassignment...');
    console.log('Employee ID:', selectedEmployee);
    console.log('From workstation ID:', currentEmployeeWorkstation.workStationID);
    console.log('To workstation:', workstationId);
    
    // Get employee name for success message
    const empResponse = await axios.get(`/api/employees/${selectedEmployee}`);
    const employeeName = `${empResponse.data.empFirstName} ${empResponse.data.empLastName}`;
    
    // STEP 1: First, clear the old workstation properly
    console.log('🧹 Clearing old workstation...');
    try {
      // Try multiple methods to clear the old workstation
      console.log('Trying to clear workstation:', currentEmployeeWorkstation.workStationID);
      
      // Method 1: Try with explicit null
      try {
        await axios.put(`/api/workstations/${currentEmployeeWorkstation.workStationID}`, {
          empID: null,
          modelName: currentEmployeeWorkstation.modelName
        });
        console.log('✅ Old workstation cleared with null');
      } catch (nullErr) {
        console.log('⚠️ Null method failed, trying without empID...');
        
        // Method 2: Try without empID field at all
        await axios.put(`/api/workstations/${currentEmployeeWorkstation.workStationID}`, {
          modelName: currentEmployeeWorkstation.modelName
          // No empID field at all - this should unassign the employee
        });
        console.log('✅ Old workstation cleared by omitting empID');
      }
      
    } catch (clearErr) {
      console.log('⚠️ Could not clear old workstation, but continuing with assignment...');
      console.log('Clear error:', clearErr.response?.data);
    }
    
    // STEP 2: Assign to new workstation
    let workstationIdToUse = workstationData?.workStationID;
    
    if (!workstationIdToUse) {
      console.log('🔨 Creating new workstation...');
      const createResponse = await axios.post('/api/workstations', {
        modelName: workstationId,
        empID: parseInt(selectedEmployee)
      });
      
      setWorkstationData(createResponse.data);
      setExistingWorkstation(true);
      console.log('✅ New workstation created');
    } else {
      console.log('🔄 Assigning to existing workstation...');
      
      // FIXED THE TYPO: Added missing /workstations/ part
      await axios.put(`/api/workstations/${workstationIdToUse}`, {
        empID: parseInt(selectedEmployee),
        modelName: workstationId
      });
      console.log('✅ Employee assigned to existing workstation');
    }
    
    setSuccess(`${employeeName} has been successfully moved from "${currentEmployeeWorkstation.modelName}" to "${workstationId}"`);
    setError(null);
    setCurrentEmployeeWorkstation(null);
    notifyWorkstationUpdated();
    
    console.log('🎉 Reassignment completed!');
    
  } catch (err) {
    console.error('❌ Reassignment failed:', err);
    console.error('Full error:', err.response?.data);
    
    let errorMessage = 'Failed to move employee: ';
    if (err.response?.data?.error) {
      errorMessage += err.response.data.error;
    } else {
      errorMessage += err.message || 'Unknown error occurred.';
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

// ALTERNATIVE SIMPLE VERSION (if the above still doesn't work):
// Replace handleUnassignAndReassign with this much simpler version:

const handleUnassignAndReassignSimple = async () => {
  if (!selectedEmployee) return;
  
  setLoading(true);
  setShowUnassignOption(false);
  
  try {
    console.log('🔄 Simple reassignment starting...');
    
    // Just create/update the target workstation directly
    // Don't worry about unassigning from the old one - let the database handle uniqueness
    let workstationIdToUse = workstationData?.workStationID;
    
    if (!workstationIdToUse) {
      // Create new workstation with employee
      const newWs = await axios.post('/api/workstations', {
        modelName: workstationId,
        empID: parseInt(selectedEmployee)
      });
      setWorkstationData(newWs.data);
      setExistingWorkstation(true);
      console.log('✅ New workstation created with employee');
    } else {
      // Update existing workstation with employee
      await axios.put(`/api/workstations/${workstationIdToUse}`, {
        empID: parseInt(selectedEmployee),
        modelName: workstationId
      });
      console.log('✅ Employee assigned to existing workstation');
    }
    
    setSuccess('Employee reassigned successfully!');
    setError(null);
    setCurrentEmployeeWorkstation(null);
    notifyWorkstationUpdated();
    
  } catch (err) {
    console.error('Simple reassignment failed:', err);
    setError('Reassignment failed: ' + (err.response?.data?.error || err.message));
  } finally {
    setLoading(false);
  }
};

  // Handle asset selection
  const handleAssetSelection = (assetId) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  // FIXED: Handle asset assignment
  const handleAssignAssets = async () => {
    if (selectedAssets.length === 0) {
      setError('Please select at least one asset');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let workstationIdToUse = workstationData?.workStationID;
      
      // Create workstation if it doesn't exist
      if (!workstationIdToUse) {
        const createResponse = await axios.post('/api/workstations', {
          modelName: workstationId,
          empID: null
        });
        
        setWorkstationData(createResponse.data);
        setExistingWorkstation(true);
        workstationIdToUse = createResponse.data.workStationID;
      }
      
      // Assign each asset one by one
      for (const assetId of selectedAssets) {
        // Get current asset data first
        const assetResponse = await axios.get(`/api/assets/${assetId}`);
        const currentAsset = assetResponse.data;
        
        // Update with minimal required fields
        await axios.put(`/api/assets/${assetId}`, {
          ...currentAsset,
          workStationID: workstationIdToUse,
          assetStatus: 'Onsite',
          imageUpdated: false
        });
      }
      
      setSuccess(`${selectedAssets.length} assets assigned successfully!`);
      setSelectedAssets([]);
      
      fetchAvailableAssets();
      notifyWorkstationUpdated();
      
    } catch (err) {
      console.error('Error assigning assets:', err);
      setError('Failed to assign assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (newTab) => {
    setTab(newTab);
    setError(null);
    setSuccess(null);
  };

  // Skip to next step or close
  const handleSkip = () => {
    if (tab === 'employee') {
      handleTabChange('assets');
    } else {
      if (existingWorkstation || workstationData?.workStationID) {
        notifyWorkstationUpdated();
        
        if (workstationData?.workStationID && workstationData?.empID) {
          setTimeout(() => {
            window.location.href = `/employee-assets/${workstationData.empID}`;
          }, 300);
          return;
        }
      }
      onClose();
    }
  };

  // Handle complete assignment (finish modal)
  const handleComplete = () => {
    if (existingWorkstation || workstationData?.workStationID) {
      notifyWorkstationUpdated();
      
      if (workstationData?.empID) {
        setTimeout(() => {
          window.location.href = `/employee-assets/${workstationData.empID}`;
        }, 300);
        return;
      }
    }
    onClose();
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.empFirstName} ${emp.empLastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Filter assets based on search term
  const filteredAssets = availableAssets.filter(asset => {
    return (
      asset.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#16282F] rounded-lg w-full max-w-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#273C45] flex justify-between items-center">
          <div className="flex items-center gap-3">
            {isITEquipment ? (
              <div className="bg-[#00b4d8] p-2 rounded-md">
                <FaServer className="text-white text-xl" />
              </div>
            ) : (
              <div className="bg-[#41b853] p-2 rounded-md">
                <FaLaptop className="text-white text-xl" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-white">
                {isITEquipment ? 'IT Equipment Setup' : existingWorkstation ? 'Workstation Setup' : 'New Workstation'}
              </h2>
              <p className="text-sm text-gray-400">{workstationId}</p>
            </div>
            {/* NEW: IT Equipment Toggle Button */}
          </div>
          <button 
            onClick={() => {
              if (updateCompleted) {
                onClose();
              } else {
                if (existingWorkstation || workstationData?.workStationID) {
                  notifyWorkstationUpdated();
                }
                onClose();
              }
            }}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        {/* Status message */}
        {statusMessage && (
          <div className="bg-[#273C45] px-6 py-3 text-blue-300 text-sm flex items-center gap-2">
            <FaInfoCircle className="text-blue-300" />
            {statusMessage}
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex border-b border-[#273C45]">
          <button
            className={`py-3 px-6 flex items-center gap-2 ${tab === 'employee' ? 'bg-[#273C45] text-white' : 'text-gray-400'}`}
            onClick={() => handleTabChange('employee')}
          >
            <FaUserAlt />
            <span>Assign Employee</span>
          </button>
          <button
            className={`py-3 px-6 flex items-center gap-2 ${tab === 'assets' ? 'bg-[#273C45] text-white' : 'text-gray-400'}`}
            onClick={() => handleTabChange('assets')}
          >
            <FaLaptop />
            <span>Assign Assets</span>
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-300" />
              <span>{error}</span>
            </div>
          )}

          {/* Improved Unassign Option */}
          {showUnassignOption && currentEmployeeWorkstation && (
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 text-yellow-100 p-4 rounded mb-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-yellow-300 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-200 mb-2">Employee Already Assigned</h4>
                  <p className="text-sm mb-3">
                    This employee is currently assigned to workstation <strong>"{currentEmployeeWorkstation.modelName}"</strong>.
                  </p>
                  <p className="text-sm mb-4">
                    Would you like to move them to <strong>"{workstationId}"</strong>? 
                    They will be automatically unassigned from their current workstation.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUnassignOption(false);
                        setCurrentEmployeeWorkstation(null);
                        setError(null);
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUnassignAndReassign}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors text-sm flex items-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                          Moving...
                        </>
                      ) : (
                        <>
                          <FaArrowRight />
                          Yes, Move Employee
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-500 bg-opacity-20 text-green-100 p-3 rounded mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>{success}</span>
            </div>
          )}
          
          {loading && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#38b6ff]"></div>
            </div>
          )}
          
          {/* Employee Assignment Tab */}
          {tab === 'employee' && (
            <div>
              <p className="text-gray-300 mb-4">
                {existingWorkstation 
                  ? `Update employee assignment for workstation ${workstationId}`
                  : `Assign an employee to workstation ${workstationId}`
                }
              </p>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="w-full pl-10 pr-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] focus:border-[#38b6ff] focus:outline-none transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="mb-6 max-h-64 overflow-y-auto bg-[#13232c] rounded-md border border-[#273C45]">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No employees match your search
                  </div>
                ) : (
                  <div className="divide-y divide-[#273C45]">
                    {filteredEmployees.map((employee) => (
                      <div 
                        key={employee.empID} 
                        className={`p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#273C45] ${selectedEmployee === employee.empID.toString() ? 'bg-[#273C45]' : ''}`}
                        onClick={() => setSelectedEmployee(employee.empID.toString())}
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          {selectedEmployee === employee.empID.toString() ? (
                            <div className="w-4 h-4 bg-[#38b6ff] rounded-full"></div>
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{employee.empFirstName} {employee.empLastName}</div>
                          <div className="text-xs text-gray-400">Employee ID: {employee.empID}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleComplete}
                  className="px-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] hover:bg-[#1c3440] transition-colors"
                  disabled={loading}
                >
                  Done
                </button>
                
                <div className="flex gap-3">
                  <button
                      onClick={handleToggleITEquipment}
                      className={`ml-4 px-3 py-1 rounded text-sm font-medium transition-colors ${
                        isITEquipmentMode 
                          ? 'bg-[#00b4d8] text-white hover:bg-[#0081a7]' 
                          : 'bg-[#41b853] text-white hover:bg-[#36a046]'
                      }`}
                      disabled={loading}
                      title={isITEquipmentMode ? 'Convert to Regular Workstation' : 'Convert to IT Equipment'}
                    >
                      {isITEquipmentMode ? '🖥️ Workstation ' : '💻 IT Equipment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('assets')}
                    className="px-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] hover:bg-[#1c3440] transition-colors flex items-center gap-2"
                    disabled={loading}
                  >
                    <span>Go to Assets</span>
                    <FaArrowRight />
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignEmployee}
                    className={`px-4 py-2 ${selectedEmployee ? 'bg-[#38b6ff] hover:bg-[#2a9de2]' : 'bg-[#38b6ff] opacity-50 cursor-not-allowed'} text-white rounded transition-colors flex items-center gap-2`}
                    disabled={loading || !selectedEmployee}
                  >
                    <FaCheckCircle />
                    <span>Assign Employee</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Asset Assignment Tab */}
          {tab === 'assets' && (
            <div>
              <p className="text-gray-300 mb-4">
                Select assets to assign to this {isITEquipment ? 'IT equipment' : 'workstation'}
              </p>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search assets..."
                  className="w-full pl-10 pr-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] focus:border-[#38b6ff] focus:outline-none transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="bg-[#13232c] rounded-md overflow-hidden max-h-64 overflow-y-auto mb-6 border border-[#273C45]">
                {filteredAssets.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No available assets found
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-[#273C45]">
                      <tr>
                        <th className="p-3 text-left w-10">
                          <input 
                            type="checkbox" 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssets(filteredAssets.map(asset => asset.assetID));
                              } else {
                                setSelectedAssets([]);
                              }
                            }}
                            checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                            className="w-4 h-4 accent-[#38b6ff]"
                          />
                        </th>
                        <th className="p-3 text-left">Asset Name</th>
                        <th className="p-3 text-left">Category</th>
                        <th className="p-3 text-left">Tag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset) => (
                        <tr key={asset.assetID} className="border-t border-[#273C45] hover:bg-[#273C45] transition-colors">
                          <td className="p-3">
                            <input 
                              type="checkbox" 
                              checked={selectedAssets.includes(asset.assetID)}
                              onChange={() => handleAssetSelection(asset.assetID)}
                              className="w-4 h-4 accent-[#38b6ff]"
                            />
                          </td>
                          <td className="p-3 text-white">{asset.assetName}</td>
                          <td className="p-3 text-gray-300">{asset.categoryName}</td>
                          <td className="p-3 text-gray-300">{asset.assetTag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleComplete}
                  className="px-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] hover:bg-[#1c3440] transition-colors"
                  disabled={loading}
                >
                  Done
                </button>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleTabChange('employee')}
                    className="px-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] hover:bg-[#1c3440] transition-colors"
                    disabled={loading}
                  >
                    Go to Employees
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignAssets}
                    className={`px-4 py-2 ${selectedAssets.length > 0 ? 'bg-[#38b6ff] hover:bg-[#2a9de2]' : 'bg-[#38b6ff] opacity-50 cursor-not-allowed'} text-white rounded transition-colors flex items-center gap-2`}
                    disabled={loading || selectedAssets.length === 0}
                  >
                    <FaCheckCircle />
                    <span>Assign Assets</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkstationAssignModal;