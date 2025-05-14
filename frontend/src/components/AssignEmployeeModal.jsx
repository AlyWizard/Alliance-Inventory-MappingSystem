// src/components/AssignEmployeeModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignEmployeeModal = ({ isOpen, onClose, workstationId, onAssign }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load employees when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again.');
      // Fallback data if API fails
      setEmployees([
        { empID: 1, empFirstName: 'John', empLastName: 'Doe' },
        { empID: 2, empFirstName: 'Jane', empLastName: 'Smith' },
        { empID: 3, empFirstName: 'Michael', empLastName: 'Johnson' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle employee assignment
  const handleAssign = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee.');
      return;
    }

    try {
      setLoading(true);
      
      // Update workstation with the selected employee
      const response = await axios.put(`/api/workstations/${workstationId}`, {
        empID: selectedEmployee,
        // We need to include modelName in the PUT request as it's required
        // For demo purposes, we'll use a placeholder
        modelName: `Workstation ${workstationId}`
      });
      
      if (onAssign) {
        onAssign(response.data);
      }
      
      onClose();
    } catch (err) {
      console.error('Error assigning employee:', err);
      setError('Failed to assign employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-[#16282F] text-white rounded-lg p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-[#273C45] pb-4 mb-4">
          <h2 className="text-xl font-bold">Assign Employee to Workstation</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        {/* Modal Content */}
        <div>
          {loading && !employees.length ? (
            <div className="text-center py-4">
              <div className="inline-block w-8 h-8 border-t-2 border-b-2 border-[#41b853] rounded-full animate-spin"></div>
              <p className="mt-2">Loading employees...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">
                  Workstation
                </label>
                <div className="bg-[#1c3640] p-3 rounded">
                  {workstationId}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">
                  Select Employee
                </label>
                <select
                  className="w-full bg-[#1c3640] border border-[#273C45] rounded p-3"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">-- Select an employee --</option>
                  {employees.map(employee => (
                    <option key={employee.empID} value={employee.empID}>
                      {employee.empFirstName} {employee.empLastName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="flex justify-end mt-6 space-x-3">
          <button 
            onClick={onClose}
            className="bg-[#273C45] text-white px-4 py-2 rounded hover:bg-[#1c3640]"
          >
            Cancel
          </button>
          <button 
            onClick={handleAssign}
            className="bg-[#41b853] text-white px-4 py-2 rounded hover:bg-[#36a046]"
            disabled={loading || !selectedEmployee}
          >
            {loading ? 'Assigning...' : 'Assign Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignEmployeeModal;