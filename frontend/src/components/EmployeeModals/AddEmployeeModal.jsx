//frontend/src/components/AddEmployeeModal.jsx
import React, { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from '../../api';

const AddEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    empFirstName: '',
    empLastName: '',
    empUserName: '',
    empDept: '',
    employeeStatus: 'active'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Predefined departments
  const departmentsList = [
    'IT',
    'HR',
    'Finance',
    'Marketing',
    'Operations',
    'Alliance IT Department - Intern',
    'Accounting',
    'Broker Experience',
    'Escalation',
    'AU Accounts',
    'PHD',
    'Source',
    'Data Entry',
    'QA Packaging',
    'Credit',
    'Client Care',
    'Admin',
    'Training'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear specific error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.empFirstName.trim()) newErrors.empFirstName = 'First name is required';
    if (!formData.empLastName.trim()) newErrors.empLastName = 'Last name is required';
    if (!formData.empUserName.trim()) newErrors.empUserName = 'Username is required';
    if (!formData.empDept.trim()) newErrors.empDept = 'Department is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Prepare payload matching your database structure
      const payload = {
        empFirstName: formData.empFirstName.trim(),
        empLastName: formData.empLastName.trim(),
        empUserName: formData.empUserName.trim(),
        empDept: formData.empDept,
        employeeCount: 0, // Default value as per your schema
        employeeStatus: formData.employeeStatus,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      
      const response = await axios.post('/api/employees', payload);
      
      setLoading(false);
      onSuccess(response.data);
      resetForm();
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Error creating employee:', error);
      
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Failed to create employee. Please try again.' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      empFirstName: '',
      empLastName: '',
      empUserName: '',
      empDept: '',
      employeeStatus: 'active'
    });
    setErrors({});
  };

  if (!isOpen) return null;

  // Generate username suggestion based on first and last name
  const suggestUsername = () => {
    const first = formData.empFirstName.trim();
    const last = formData.empLastName.trim();
    
    if (first && last) {
      // First letter of first name + last name, all lowercase
      const suggested = (first.charAt(0) + last).toLowerCase().replace(/\s/g, '');
      setFormData({
        ...formData,
        empUserName: suggested
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#25424D] rounded-lg w-full max-w-lg p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Add Employee
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
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Employee Name */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Employee Name</label>
              <input
                type="text"
                name="empFirstName"
                value={formData.empFirstName}
                onChange={handleChange}
                onBlur={suggestUsername}
                className={`w-full bg-[#1F3A45] rounded p-2 ${errors.empFirstName ? 'border border-red-500' : ''}`}
                placeholder="Enter first name"
              />
              {errors.empFirstName && <p className="text-red-500 text-xs mt-1">{errors.empFirstName}</p>}
            </div>
            
            {/* Last Name */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Last Name</label>
              <input
                type="text"
                name="empLastName"
                value={formData.empLastName}
                onChange={handleChange}
                onBlur={suggestUsername}
                className={`w-full bg-[#1F3A45] rounded p-2 ${errors.empLastName ? 'border border-red-500' : ''}`}
                placeholder="Enter last name"
              />
              {errors.empLastName && <p className="text-red-500 text-xs mt-1">{errors.empLastName}</p>}
            </div>
          </div>
          
          {/* Username */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Username</label>
            <input
              type="text"
              name="empUserName"
              value={formData.empUserName}
              onChange={handleChange}
              className={`w-full bg-[#1F3A45] rounded p-2 ${errors.empUserName ? 'border border-red-500' : ''}`}
              placeholder="Enter username"
            />
            {errors.empUserName && <p className="text-red-500 text-xs mt-1">{errors.empUserName}</p>}
          </div>
          
          {/* Department */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Department</label>
            <div className="relative">
              <select
                name="empDept"
                value={formData.empDept}
                onChange={handleChange}
                className={`w-full bg-[#1F3A45] rounded p-2 pr-8 appearance-none ${errors.empDept ? 'border border-red-500' : ''}`}
              >
                <option value="">Select Department</option>
                {departmentsList.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {errors.empDept && <p className="text-red-500 text-xs mt-1">{errors.empDept}</p>}
          </div>
          
          {/* Status */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Status</label>
            <div className="relative">
              <select
                name="employeeStatus"
                value={formData.employeeStatus}
                onChange={handleChange}
                className="w-full bg-[#1F3A45] rounded p-2 pr-8 appearance-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Error message */}
          {errors.general && (
            <div className="mb-4 p-2 bg-red-500 bg-opacity-20 rounded">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0075A2] hover:bg-[#0088BC] text-white py-2 px-8 rounded-md transition-colors flex items-center justify-center min-w-[100px]"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;