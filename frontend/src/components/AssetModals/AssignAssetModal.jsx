import React, { useState, useEffect } from 'react';
import axios from '../../api';

const AssignAssetModal = ({ isOpen, onClose, assetIds, onSuccess }) => {
  // State for employees
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // State for workstations
  const [workstations, setWorkstations] = useState([]);
  const [selectedWorkstation, setSelectedWorkstation] = useState('');
  
  // State for status
  const [assetStatus, setAssetStatus] = useState('Onsite');
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch employees on component mount
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);
  
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
      setSelectedWorkstation(response.data.length > 0 ? response.data[0].workStationID : '');
      
      // If no workstations exist, create a default one
      if (response.data.length === 0) {
        createDefaultWorkstation(empId);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching workstations:', err);
      // Try to create a default workstation
      createDefaultWorkstation(empId);
    } finally {
      setLoading(false);
    }
  };
  
  // Create a default workstation if none exist
  const createDefaultWorkstation = async (empId) => {
    try {
      const response = await axios.post('/api/workstations', {
        modelName: 'Default Workstation',
        empID: empId
      });
      
      setWorkstations([response.data]);
      setSelectedWorkstation(response.data.workStationID);
    } catch (err) {
      console.error('Error creating default workstation:', err);
      setError('Failed to create a workstation. Please try again.');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      setError('Please select an employee.');
      return;
    }
    
    if (!selectedWorkstation) {
      setError('Please select a workstation.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if any assets are already assigned
      const assignedAssets = [];
      
      for (const assetId of assetIds) {
        const response = await axios.get(`/api/assets/${assetId}`);
        if (response.data.workStationID !== null) {
          assignedAssets.push(response.data);
        }
      }
      
      // If any assets are already assigned, show error
      if (assignedAssets.length > 0) {
        const assetNames = assignedAssets.map(asset => asset.assetName).join(', ');
        setError(`The following assets are already assigned: ${assetNames}. Please unassign them first.`);
        setLoading(false);
        return;
      }
      
      // Update each asset with the selected workstation
      const updatePromises = assetIds.map(assetId => 
        axios.put(`/api/assets/${assetId}`, {
          workStationID: selectedWorkstation,
          assetStatus: assetStatus
        })
      );
      
      const results = await Promise.all(updatePromises);
      
      // Call onSuccess with the updated assets
      if (onSuccess) {
        onSuccess(results.map(result => result.data));
      }
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error assigning assets:', err);
      setError('Failed to assign assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#16282F] rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-[#273C45]">
          <h2 className="text-xl font-semibold text-white">Assign Assets</h2>
          <p className="text-gray-400 mt-1">Assigning {assetIds.length} selected asset(s)</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Employee</label>
            <select
              className="w-full bg-[#13232c] text-white p-2 rounded border border-[#273C45]"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.empID} value={employee.empID}>
                  {employee.empFirstName} {employee.empLastName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Workstation</label>
            <select
              className="w-full bg-[#13232c] text-white p-2 rounded border border-[#273C45]"
              value={selectedWorkstation}
              onChange={(e) => setSelectedWorkstation(e.target.value)}
              disabled={!selectedEmployee || loading}
            >
              <option value="">Select Workstation</option>
              {workstations.map((workstation) => (
                <option key={workstation.workStationID} value={workstation.workStationID}>
                  {workstation.modelName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Asset Status</label>
            <select
              className="w-full bg-[#13232c] text-white p-2 rounded border border-[#273C45]"
              value={assetStatus}
              onChange={(e) => setAssetStatus(e.target.value)}
              disabled={loading}
            >
              <option value="Onsite">Onsite</option>
              <option value="WFH">Work From Home</option>
              <option value="Temporarily Deployed">Temporarily Deployed</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? 'Assigning...' : 'Assign Assets'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignAssetModal;