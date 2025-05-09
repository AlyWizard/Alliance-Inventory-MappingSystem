// EditManufacturerModal.jsx
import React, { useState, useEffect } from 'react';
import axios from '../../api';

const EditManufacturerModal = ({ isOpen, onClose, onSuccess, manufacturer }) => {
  const [formData, setFormData] = useState({
    manufName: '',
    manufacturerCount: 0,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Set form data when manufacturer prop changes
  useEffect(() => {
    if (manufacturer) {
      setFormData({
        manufName: manufacturer.manufName || '',
        manufacturerCount: manufacturer.manufacturerCount || 0,
      });
    }
  }, [manufacturer]);

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
    
    if (!formData.manufName.trim()) newErrors.manufName = 'Manufacturer name is required';
    
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
        manufID: manufacturer.manufID,
        manufName: formData.manufName.trim(),
        manufacturerCount: parseInt(formData.manufacturerCount) || 0,
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      
      const response = await axios.put(`/api/manufacturers/${manufacturer.manufID}`, payload);
      
      setLoading(false);
      onSuccess(response.data);
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Error updating manufacturer:', error);
      
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Failed to update manufacturer. Please try again.' });
      }
    }
  };

  if (!isOpen || !manufacturer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#25424D] rounded-lg w-full max-w-lg p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            Edit Manufacturer
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
          {/* Manufacturer ID (Readonly) */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Manufacturer ID</label>
            <input
              type="text"
              value={manufacturer.manufID.toString().padStart(2, '0')}
              readOnly
              className="w-full bg-[#1F3A45] rounded p-2 opacity-75"
            />
          </div>
          
          {/* Manufacturer Name */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Manufacturer Name</label>
            <input
              type="text"
              name="manufName"
              value={formData.manufName}
              onChange={handleChange}
              className={`w-full bg-[#1F3A45] rounded p-2 ${errors.manufName ? 'border border-red-500' : ''}`}
              placeholder="Enter manufacturer name"
            />
            {errors.manufName && <p className="text-red-500 text-xs mt-1">{errors.manufName}</p>}
          </div>
          
          {/* Manufacturer Count */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Manufacturer Count</label>
            <input
              type="number"
              name="manufacturerCount"
              value={formData.manufacturerCount}
              onChange={handleChange}
              min="0"
              className="w-full bg-[#1F3A45] rounded p-2"
              placeholder="Enter manufacturer count"
            />
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
              ) : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditManufacturerModal;