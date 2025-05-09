import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import axios from '../../api';

const EditWorkstationModal = ({ isOpen, onClose, workstation, employees, onSuccess }) => {
  // Form state
  const [modelName, setModelName] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // Error and loading states
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Populate form with workstation data when it changes
  useEffect(() => {
    if (workstation) {
      setModelName(workstation.modelName || '');
      setSelectedEmployee(workstation.empID || '');
      setError(null);
    }
  }, [workstation]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!modelName.trim()) {
      setError('Workstation name is required');
      return;
    }
    
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }
    
    // Check if employee changed
    const isEmployeeChanged = selectedEmployee !== workstation.empID;
    
    // If employee changed, check if workstation has assets
    if (isEmployeeChanged) {
      try {
        const response = await axios.get(`/api/workstations/${workstation.workStationID}/assets`);
        
        if (response.data.length > 0) {
          // If employee changed and workstation has assets, show confirmation
          if (!window.confirm(`This workstation has ${response.data.length} assigned assets. Changing the employee will transfer all assets to the new employee. Continue?`)) {
            return;
          }
        }
      } catch (err) {
        console.error('Error checking workstation assets:', err);
        setError('Failed to check workstation assets. Please try again.');
        return;
      }
    }
    
    setLoading(true);
    try {
      // Update workstation
      const response = await axios.put(`/api/workstations/${workstation.workStationID}`, {
        modelName: modelName.trim(),
        empID: selectedEmployee
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Close modal after successful update
      onClose();
    } catch (err) {
      console.error('Error updating workstation:', err);
      setError(err.response?.data?.error || 'Failed to update workstation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#16282F] rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-[#273C45]">
          <h2 className="text-xl font-semibold text-white">Edit Workstation</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4 flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="modelName" className="block text-gray-300 mb-2">Workstation Name</label>
            <input
              id="modelName"
              type="text"
              className="w-full bg-[#13232c] text-white p-2 rounded border border-[#273C45]"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="E.g., Engineering Workstation 1"
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="employeeSelect" className="block text-gray-300 mb-2">Assigned Employee</label>
            <select
              id="employeeSelect"
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
          
          {workstation.assetCount > 0 && (
            <div className="mb-6 bg-yellow-500 bg-opacity-20 text-yellow-100 p-3 rounded flex items-center gap-2">
              <FaExclamationTriangle />
              <span>
                This workstation has {workstation.assetCount} assigned assets. 
                Changing the employee will transfer all assets to the new employee.
              </span>
            </div>
          )}
          
          <div className="flex justify-end gap-3">
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
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Workstation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorkstationModal;