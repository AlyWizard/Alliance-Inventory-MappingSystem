import React, { useState, useEffect } from 'react';
import axios from '../api';

const AssignAssetModal = ({ isOpen, onClose, onSuccess, assetIds, employeeId = null }) => {
  const [employees, setEmployees] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedWorkstation, setSelectedWorkstation] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreatingWorkstation, setIsCreatingWorkstation] = useState(false);
  const [newWorkstationName, setNewWorkstationName] = useState('');

  // Initialize with employee ID if provided (from AssetInventory)
  useEffect(() => {
    if (employeeId) {
      setSelectedEmployee(employeeId);
      fetchWorkstations(employeeId);
    }
  }, [employeeId]);

  useEffect(() => {
    if (isOpen && assetIds.length > 0) {
      fetchData();
    }
  }, [isOpen, assetIds]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees, workstations, and asset details in parallel
      const [employeesRes, assetsRes] = await Promise.all([
        axios.get('/api/employees'),
        Promise.all(assetIds.map(id => axios.get(`/api/assets/${id}`)))
      ]);
      
      setEmployees(employeesRes.data);
      setAssets(assetsRes.map(res => res.data));
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load required data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkstations = async (employeeId) => {
    if (!employeeId) {
      setWorkstations([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/employees/${employeeId}/workstations`);
      setWorkstations(response.data);
      
      // If employee has only one workstation, select it automatically
      if (response.data.length === 1) {
        setSelectedWorkstation(response.data[0].workStationID);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching workstations:', err);
      setError('Failed to load workstations. Please try again.');
      setWorkstations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    setSelectedEmployee(employeeId);
    setSelectedWorkstation('');
    setIsCreatingWorkstation(false);
    
    if (employeeId) {
      fetchWorkstations(employeeId);
    }
  };

  const createWorkstation = async () => {
    if (!selectedEmployee || !newWorkstationName.trim()) {
      setError('Employee and workstation name are required.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('/api/workstations', {
        modelName: newWorkstationName,
        empID: selectedEmployee
      });
      
      const newWorkstation = response.data;
      setWorkstations([...workstations, newWorkstation]);
      setSelectedWorkstation(newWorkstation.workStationID);
      setIsCreatingWorkstation(false);
      setNewWorkstationName('');
      
      setError(null);
    } catch (err) {
      console.error('Error creating workstation:', err);
      setError('Failed to create workstation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedWorkstation) {
      setError('Please select a workstation to assign assets to.');
      return;
    }
    
    setLoading(true);
    try {
      // Assign all selected assets to the chosen workstation
      const updatePromises = assetIds.map(assetId => 
        axios.put(`/api/assets/${assetId}`, {
          workStationID: selectedWorkstation,
          assetStatus: 'Onsite' // Update status to indicate assigned
        })
      );
      
      const updatedAssets = await Promise.all(updatePromises);
      
      setLoading(false);
      onSuccess(updatedAssets.map(res => res.data));
      onClose();
    } catch (err) {
      setLoading(false);
      console.error('Error assigning assets:', err);
      
      if (err.response && err.response.data && err.response.data.errors) {
        setError(Object.values(err.response.data.errors).join(', '));
      } else {
        setError('Failed to assign assets. Please try again.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#25424D] rounded-lg w-full max-w-xl p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Assign Assets
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
        
        {loading && assets.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0075A2]"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Selected Assets Summary */}
            <div className="mb-6">
              <div className="bg-[#1A3A4A] p-3 rounded mb-2">
                <h3 className="text-gray-400 text-sm mb-2">Selected Assets ({assetIds.length})</h3>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="space-y-1">
                  {assets.map(asset => (
                      <li key={asset.assetID} className="flex items-center gap-2">
                        {asset.imagePath && (
                          <img 
                            src={`http://localhost:3001/${asset.imagePath.split('\\').pop()}`} 
                            alt={asset.assetName} 
                            className="w-6 h-6 rounded object-cover"
                            onError={(e) => {
                              console.log("Image failed to load:", asset.imagePath);
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <span className="font-medium">{asset.assetName}</span>
                          <span className="text-gray-400 text-xs ml-2">Tag: {asset.assetTag}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Employee Selection - Only show if not pre-selected */}
            {!employeeId && (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Assign to Employee</label>
                <div className="relative">
                  <select
                    value={selectedEmployee}
                    onChange={handleEmployeeChange}
                    className="w-full bg-[#1A3A4A] rounded p-2 pr-8 appearance-none"
                    disabled={loading}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.empID} value={emp.empID}>
                        {`${emp.empFirstName} ${emp.empLastName} (${emp.empUserName})`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* Workstation Selection or Creation */}
            {selectedEmployee && (
              <div className="mb-4">
                {isCreatingWorkstation ? (
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">New Workstation Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newWorkstationName}
                        onChange={(e) => setNewWorkstationName(e.target.value)}
                        className="flex-1 bg-[#1A3A4A] rounded p-2"
                        placeholder="Enter workstation name"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={createWorkstation}
                        className="bg-[#0075A2] hover:bg-[#0088BC] text-white px-3 py-2 rounded transition-colors"
                        disabled={loading || !newWorkstationName.trim()}
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingWorkstation(false)}
                        className="bg-[#1A3A4A] hover:bg-[#2B4C58] text-white px-3 py-2 rounded transition-colors border border-[#315A6A]"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-gray-400 text-sm">Select Workstation</label>
                      <button
                        type="button"
                        onClick={() => setIsCreatingWorkstation(true)}
                        className="text-[#0075A2] hover:text-[#0088BC] text-sm"
                        disabled={loading}
                      >
                        + New Workstation
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        value={selectedWorkstation}
                        onChange={(e) => setSelectedWorkstation(e.target.value)}
                        className="w-full bg-[#1A3A4A] rounded p-2 pr-8 appearance-none"
                        disabled={loading || workstations.length === 0}
                      >
                        <option value="">Select Workstation</option>
                        {workstations.map(ws => (
                          <option key={ws.workStationID} value={ws.workStationID}>
                            {ws.modelName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {workstations.length === 0 && selectedEmployee && (
                      <p className="text-orange-400 text-xs mt-1">No workstations found for this employee. Create a new one.</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-2 bg-red-500 bg-opacity-20 rounded">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={loading || !selectedWorkstation}
                className="bg-[#0075A2] hover:bg-[#0088BC] text-white py-2 px-6 rounded-md transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Assign'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AssignAssetModal;