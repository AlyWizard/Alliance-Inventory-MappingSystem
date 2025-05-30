import React, { useState } from 'react';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
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
  
  // Validate workstation name format
  const validateWorkstationFormat = (name) => {
    // WSM followed by numbers (e.g., WSM001, WSM123, WSM1)
    const pattern = /^WSM\d+$/;
    return pattern.test(name.trim().toUpperCase());
  };
  
  // Check if workstation name already exists
  const checkWorkstationExists = async (name) => {
    try {
      const response = await axios.get('/api/workstations');
      const existingWorkstation = response.data.find(ws => 
        ws.modelName.toUpperCase() === name.trim().toUpperCase()
      );
      return existingWorkstation !== undefined;
    } catch (err) {
      console.error('Error checking existing workstations:', err);
      return false; // If can't check, allow creation (better UX)
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!modelName.trim()) {
      setError('Workstation name is required');
      return;
    }
    
    // Validate format
    if (!validateWorkstationFormat(modelName)) {
      setError('Workstation name must follow the format WSM###');
      return;
    }
    
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }
    
    setLoading(true);
    try {
      // Check if workstation already exists
      const exists = await checkWorkstationExists(modelName);
      if (exists) {
        setError(`Workstation "${modelName.trim().toUpperCase()}" already exists. Please use a different name.`);
        setLoading(false);
        return;
      }
      
      // Create workstation with proper format
      const formattedName = modelName.trim().toUpperCase();
      const response = await axios.post('/api/workstations', {
        modelName: formattedName,
        empID: selectedEmployee
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Close modal after successful creation
      onClose();
    } catch (err) {
      console.error('Error creating workstation:', err);
      
      // Handle specific errors
      if (err.response?.status === 400 && err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.error?.includes('already exists') || 
                 err.response?.data?.error?.includes('duplicate')) {
        setError(`Workstation "${modelName.trim().toUpperCase()}" already exists. Please use a different name.`);
      } else {
        setError('Failed to create workstation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input change with format hints
  const handleNameChange = (e) => {
    const value = e.target.value;
    setModelName(value);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };
  
  // Format validation status
  const getFormatStatus = () => {
    if (!modelName.trim()) return null;
    
    if (validateWorkstationFormat(modelName)) {
      return { isValid: true, message: 'Format is correct' };
    } else {
      return { isValid: false, message: 'Must be WSM followed by numbers' };
    }
  };
  
  const formatStatus = getFormatStatus();
  
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
            <label htmlFor="modelName" className="block text-gray-300 mb-2">
              Workstation Name
            </label>
            
            {/* Format Guidelines */}
            <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 text-blue-100 p-3 rounded mb-3 text-sm">
              <div className="flex items-start gap-2">
                <FaInfoCircle className="text-blue-300 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-1">Naming Format:</div>
                  <div>• Must start with <strong>WSM</strong></div>
                  <div>• Followed by numbers (e.g., WSM001, WSM123)</div>
                  <div>• Examples: <span className="text-blue-200">WSM001, WSM090, WSM145</span></div>
                </div>
              </div>
            </div>
            
            <input
              id="modelName"
              type="text"
              className={`w-full bg-[#13232c] text-white p-2 rounded border transition-colors ${
                formatStatus?.isValid === false 
                  ? 'border-red-500 focus:border-red-400' 
                  : formatStatus?.isValid === true 
                    ? 'border-green-500 focus:border-green-400'
                    : 'border-[#273C45] focus:border-[#38b6ff]'
              }`}
              value={modelName}
              onChange={handleNameChange}
              placeholder="WSM###"
              disabled={loading}
            />
            
            {/* Format Status Indicator */}
            {formatStatus && (
              <div className={`mt-2 text-sm flex items-center gap-2 ${
                formatStatus.isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatStatus.isValid ? '✓' : '✗'}
                <span>{formatStatus.message}</span>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="employeeSelect" className="block text-gray-300 mb-2">
              Assign to Employee
            </label>
            <select
              id="employeeSelect"
              className="w-full bg-[#13232c] text-white p-2 rounded border border-[#273C45] focus:border-[#38b6ff]"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.empID} value={employee.empID}>
                  {employee.empFirstName} {employee.empLastName} (ID: {employee.empID})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#13232c] text-white rounded border border-[#273C45] hover:bg-[#1c3440] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded transition-colors ${
                loading || !formatStatus?.isValid
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-[#38b6ff] hover:bg-[#2a9de2]'
              }`}
              disabled={loading || !formatStatus?.isValid}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Workstation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkstationModal;