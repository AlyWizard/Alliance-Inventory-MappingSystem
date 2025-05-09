import React, { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import axios from '../../api';

const AddWorkstationModal = ({ isOpen, onClose, employees, onSuccess }) => {
  // Form state
  const [modelName, setModelName] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // Error and loading states
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setModelName('');
      setSelectedEmployee('');
      setError(null);
    }
  }, [isOpen]);
  
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
    
    setLoading(true);
    try {
      // Create workstation
      const response = await axios.post('/api/workstations', {
        modelName: modelName.trim(),
        empID: selectedEmployee
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Close modal after successful creation
      onClose();
    } catch (err) {
      console.error('Error creating workstation:', err);
      setError(err.response?.data?.error || 'Failed to create workstation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#16282F] rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-[#273C45]">
          <h2 className="text-xl font-semibold text-white">Add New Workstation</h2>
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
          
          <div className="mb-6">
            <label htmlFor="employeeSelect" className="block text-gray-300 mb-2">Assign to Employee</label>
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
              {loading ? 'Creating...' : 'Create Workstation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkstationModal;