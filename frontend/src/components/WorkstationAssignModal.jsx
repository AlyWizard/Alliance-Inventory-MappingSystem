import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaExclamationTriangle, FaUserAlt, FaLaptop, FaServer, FaUsers, FaArrowRight, FaCheckCircle, FaTimesCircle, FaSearch } from 'react-icons/fa';

const WorkstationAssignModal = ({ isOpen, onClose, workstationId }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [workstationData, setWorkstationData] = useState(null);
  const [tab, setTab] = useState('employee'); // 'employee' or 'assets'
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [existingWorkstation, setExistingWorkstation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isITEquipment, setIsITEquipment] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [updateCompleted, setUpdateCompleted] = useState(false);

  // Helper function to normalize workstation IDs for comparison
  const normalizeId = (id) => {
    if (!id) return '';
    // Remove prefix like WSM, ASCL, etc., remove dashes and spaces, and convert to lowercase
    return id.toString().replace(/^(WSM|ASCL|STK)[- ]?/i, '').replace(/[- ]/g, '').toLowerCase();
  };

  // Check if workstation is IT equipment
  useEffect(() => {
    if (workstationId) {
      // Check if workstation is IT equipment
      const isIT = workstationId.startsWith('SVR') || 
                  workstationId === 'SVR02' || 
                  workstationId === 'SVR001' || 
                  workstationId.startsWith('BR') || 
                  workstationId === 'BR01' || 
                  workstationId === 'WSM090';
      
      setIsITEquipment(isIT);
      
      if (isIT) {
        let equipmentType = '';
        if (workstationId.startsWith('SVR') || workstationId === 'SVR02' || workstationId === 'SVR001') {
          equipmentType = 'Server';
          setStatusMessage('This is a server equipment. Assignment is optional.');
        } else if (workstationId.startsWith('BR') || workstationId === 'BR01') {
          equipmentType = 'BoardRoom';
          setStatusMessage('This is a boardroom equipment. Assignment is optional.');
        } else if (workstationId === 'WSM090') {
          equipmentType = 'WorkStation';
          setStatusMessage('This is a personal workstation. Assignment is recommended.');
        }
      } else {
        setStatusMessage('');
      }
    }
  }, [workstationId]);

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
    }
  }, [isOpen]);

  // Check if workstation already exists
  const checkExistingWorkstation = async () => {
    try {
      setLoading(true);
      
      // Get all workstations
      const response = await axios.get('/api/workstations');
      
      // Normalize the current workstation ID
      const normalizedCurrentId = normalizeId(workstationId);
      console.log('Checking for existing workstation with normalized ID:', normalizedCurrentId);
      
      // Check if this workstation ID already exists
      // First try direct ID match
      let found = response.data.find(ws => ws.workStationID?.toString() === workstationId?.toString());
      
      // Then try exact model name match
      if (!found) {
        found = response.data.find(ws => ws.modelName === workstationId);
      }
      
      // Then try normalized ID match
      if (!found) {
        found = response.data.find(ws => {
          const normalizedModelName = normalizeId(ws.modelName);
          return normalizedModelName === normalizedCurrentId;
        });
      }
      
      // Then try to match by numeric part
      if (!found && workstationId.match(/\d+/)) {
        const numericPart = workstationId.match(/\d+/)[0].replace(/^0+/, ''); // Extract number and remove leading zeros
        found = response.data.find(ws => {
          // Try to match by workstation ID
          if (ws.workStationID?.toString() === numericPart) return true;
          
          // Try to match by numeric part in modelName
          if (ws.modelName && ws.modelName.match(/\d+/)) {
            const wsNumeric = ws.modelName.match(/\d+/)[0].replace(/^0+/, '');
            return wsNumeric === numericPart;
          }
          
          return false;
        });
      }
      
      if (found) {
        console.log('Existing workstation found:', found);
        setWorkstationData(found);
        setExistingWorkstation(true);
        
        // If workstation already has an employee assigned, pre-select that employee
        if (found.empID) {
          setSelectedEmployee(found.empID.toString());
        }
      } else {
        console.log('No existing workstation found for ID:', workstationId);
        // Create a new workstation placeholder
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
      
      // Create a new workstation placeholder
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
      // Mock data for demo
      setEmployees([
        { empID: 9, empFirstName: 'Alyssa Marie', empLastName: 'Isuan' },
        { empID: 10, empFirstName: 'Shandeloh', empLastName: 'Cayetano' },
        { empID: 11, empFirstName: 'Leo', empLastName: 'Uchi' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available assets
  const fetchAvailableAssets = async () => {
    try {
      setLoading(true);
      // Get all available assets (not assigned to any workstation)
      const response = await axios.get('/api/assets');
      
      // Filter out assets that are already assigned to a workstation
      const unassignedAssets = response.data.filter(asset => !asset.workStationID);
      
      console.log('Available assets:', unassignedAssets);
      setAvailableAssets(unassignedAssets);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching available assets:', err);
      setLoading(false);
      // Mock data for demo
      setAvailableAssets([
        { assetID: 1, assetName: 'Benq', categoryName: 'Device', assetTag: 'WSM-001' },
        { assetID: 2, assetName: 'ProMax', categoryName: 'Device', assetTag: 'WSM-002' },
        { assetID: 3, assetName: 'Benq', categoryName: 'Device', assetTag: 'WSM-003' }
      ]);
    }
  };

  // Dispatch update event to notify FloorMap of changes
  const notifyWorkstationUpdated = () => {
    console.log('Notifying of workstation update:', workstationId);
    // Create and dispatch a custom event
    const event = new CustomEvent('workstationUpdated', {
      detail: { workstationId }
    });
    window.dispatchEvent(event);
    
    // Set flag to indicate update was completed
    setUpdateCompleted(true);
  };

  // Handle employee assignment
  const handleAssignEmployee = async () => {
    if (!selectedEmployee && !isITEquipment) {
      setError('Please select an employee');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // If no employee is selected for IT equipment, that's okay - just skip
      if (!selectedEmployee && isITEquipment) {
        setTab('assets');
        setLoading(false);
        return;
      }
      
      // IMPORTANT: Check if this workstation already exists to prevent duplicates
      const response = await axios.get('/api/workstations');
      const normalizedCurrentId = normalizeId(workstationId);
      
      let existingWs = response.data.find(ws => 
        ws.modelName === workstationId || 
        normalizeId(ws.modelName) === normalizedCurrentId
      );
      
      if (existingWs && !existingWorkstation) {
        console.log('Found existing workstation that matches current ID:', existingWs);
        setWorkstationData(existingWs);
        setExistingWorkstation(true);
      }
      
      if (existingWorkstation || existingWs) {
        // If workstation already exists, update it
        const wsId = existingWs ? existingWs.workStationID : workstationData.workStationID;
        await axios.put(`/api/workstations/${wsId}`, {
          empID: selectedEmployee,
          modelName: workstationId // Always use the provided workstation ID
        });
        console.log('Updated existing workstation');
        setSuccess('Employee assignment updated successfully');
      } else {
        // If it's a new workstation, create it
        const createResponse = await axios.post('/api/workstations', {
          modelName: workstationId,
          empID: selectedEmployee
        });
        setWorkstationData(createResponse.data);
        setExistingWorkstation(true);
        console.log('Created new workstation:', createResponse.data);
        setSuccess('New workstation created with employee assignment');
      }
      
      // Notify that workstation has been updated
      notifyWorkstationUpdated();
      
      // Move to assets tab after assigning employee
      setTab('assets');
    } catch (err) {
      console.error('Error assigning employee:', err);
      setError('Failed to assign employee. Please try again.');
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

  // Handle asset assignment
  const handleAssignAssets = async () => {
    if (selectedAssets.length === 0) {
      setError('Please select at least one asset');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get the current workstation ID
      let currentWorkstationId = workstationData?.workStationID;
      
      // If we don't have a workstation ID yet (new workstation), fetch the latest data
      if (!currentWorkstationId) {
        const allWorkstations = await axios.get('/api/workstations');
        
        // Normalize the current workstation ID
        const normalizedCurrentId = normalizeId(workstationId);
        
        // Try to find using the same logic as in checkExistingWorkstation
        let matchingWorkstation = allWorkstations.data.find(ws => ws.modelName === workstationId);
        
        if (!matchingWorkstation) {
          matchingWorkstation = allWorkstations.data.find(ws => {
            const normalizedModelName = normalizeId(ws.modelName || '');
            return normalizedModelName === normalizedCurrentId;
          });
        }
        
        if (!matchingWorkstation && workstationId.match(/\d+/)) {
          const numericPart = workstationId.match(/\d+/)[0].replace(/^0+/, '');
          matchingWorkstation = allWorkstations.data.find(ws => {
            if (ws.workStationID?.toString() === numericPart) return true;
            if (ws.modelName && ws.modelName.match(/\d+/)) {
              const wsNumeric = ws.modelName.match(/\d+/)[0].replace(/^0+/, '');
              return wsNumeric === numericPart;
            }
            return false;
          });
        }
        
        if (matchingWorkstation) {
          currentWorkstationId = matchingWorkstation.workStationID;
        } else if (isITEquipment && !selectedEmployee) {
          // For IT equipment without an employee, we need to create a workstation first
          const createResponse = await axios.post('/api/workstations', {
            modelName: workstationId,
            empID: null // No employee for IT equipment
          });
          currentWorkstationId = createResponse.data.workStationID;
          setWorkstationData(createResponse.data);
          setExistingWorkstation(true);
        } else {
          setError('Workstation not found in database. Please try assigning the employee first.');
          setLoading(false);
          return;
        }
      }
      
      // For each selected asset, update it to assign to this workstation
      for (const assetId of selectedAssets) {
        await axios.put(`/api/assets/${assetId}`, {
          workStationID: currentWorkstationId,
          assetStatus: 'Onsite'
        });
      }
      
      // Notify that workstation has been updated
      notifyWorkstationUpdated();
      
      setSuccess('Assets assigned successfully!');
      setTimeout(() => {
        onClose(); // Close modal after successful assignment with a delay
      }, 1500);
    } catch (err) {
      console.error('Error assigning assets:', err);
      setError('Failed to assign assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (newTab) => {
    if (newTab === 'assets' && !workstationData?.empID && !selectedEmployee && !isITEquipment) {
      setError('Please assign an employee first');
      return;
    }
    
    setTab(newTab);
    setError(null);
    setSuccess(null);
  };

  // Skip to next step
  const handleSkip = () => {
    if (tab === 'employee') {
      handleTabChange('assets');
    } else {
      // Before closing, make sure we notify FloorMap of any changes
      if (existingWorkstation || workstationData?.workStationID) {
        notifyWorkstationUpdated();
      }
      onClose();
    }
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.empFirstName} ${emp.empLastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Filter assets based on search term
  const filteredAssets = availableAssets.filter(asset => {
    return (
      asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase())
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
          </div>
          <button 
            onClick={() => {
              // Ensure FloorMap is updated before closing
              if (updateCompleted) {
                onClose();
              } else {
                // Only notify if changes were made
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
        
        {/* Status message for IT equipment */}
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
            <span>1. Assign Employee</span>
          </button>
          <button
            className={`py-3 px-6 flex items-center gap-2 ${tab === 'assets' ? 'bg-[#273C45] text-white' : 'text-gray-400'}`}
            onClick={() => handleTabChange('assets')}
          >
            <FaLaptop />
            <span>2. Assign Assets</span>
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-300" />
              <span>{error}</span>
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
                {isITEquipment 
                  ? 'Assign an employee to this IT equipment (optional)'
                  : existingWorkstation 
                    ? `Update employee assignment for workstation ${workstationId}`
                    : `Assign an employee to new workstation ${workstationId}`
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
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] hover:bg-[#1c3440] transition-colors flex items-center gap-2"
                  disabled={loading}
                >
                  <span>Skip</span>
                  <FaArrowRight />
                </button>
                <button
                  type="button"
                  onClick={handleAssignEmployee}
                  className={`px-4 py-2 ${(selectedEmployee || isITEquipment) ? 'bg-[#38b6ff] hover:bg-[#2a9de2]' : 'bg-[#38b6ff] opacity-50 cursor-not-allowed'} text-white rounded transition-colors flex items-center gap-2`}
                  disabled={loading || (!selectedEmployee && !isITEquipment)}
                >
                  <FaCheckCircle />
                  <span>{existingWorkstation ? 'Update' : 'Create'} & Next</span>
                </button>
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
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleTabChange('employee')}
                  className="px-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] hover:bg-[#1c3440] transition-colors flex items-center gap-2"
                  disabled={loading}
                >
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] hover:bg-[#1c3440] transition-colors flex items-center gap-2"
                  disabled={loading}
                >
                  <span>Skip</span>
                  <FaTimesCircle />
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
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkstationAssignModal;

// Import at the top
import { FaInfoCircle } from 'react-icons/fa';