// AddModelModal.jsx
import React, { useState } from 'react';
import axios from '../api';

const AddModelModal = ({ isOpen, onClose, onSuccess, categories, manufacturers }) => {
  const [formData, setFormData] = useState({
    modelName: '',
    manufID: '',
    categoryID: '',
    modelCount: 0,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    
    if (!formData.modelName.trim()) newErrors.modelName = 'Model name is required';
    if (!formData.manufID) newErrors.manufID = 'Manufacturer is required';
    if (!formData.categoryID) newErrors.categoryID = 'Category is required';
    
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
        modelName: formData.modelName.trim(),
        manufID: parseInt(formData.manufID),
        categoryID: parseInt(formData.categoryID),
        modelCount: parseInt(formData.modelCount) || 0,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      
      const response = await axios.post('/api/models', payload);
      
      setLoading(false);
      onSuccess(response.data);
      resetForm();
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Error creating model:', error);
      
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Failed to create model. Please try again.' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      modelName: '',
      manufID: '',
      categoryID: '',
      modelCount: 0
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#25424D] rounded-lg w-full max-w-lg p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Add Model
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
          {/* Model Name */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Model Name</label>
            <input
              type="text"
              name="modelName"
              value={formData.modelName}
              onChange={handleChange}
              className={`w-full bg-[#1F3A45] rounded p-2 ${errors.modelName ? 'border border-red-500' : ''}`}
              placeholder="Enter model name"
            />
            {errors.modelName && <p className="text-red-500 text-xs mt-1">{errors.modelName}</p>}
          </div>
          
          {/* Manufacturer Selection */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Manufacturer</label>
            <select
              name="manufID"
              value={formData.manufID}
              onChange={handleChange}
              className={`w-full bg-[#1F3A45] rounded p-2 ${errors.manufID ? 'border border-red-500' : ''}`}
            >
              <option value="">Select Manufacturer</option>
              {manufacturers && manufacturers.map(manufacturer => (
                <option key={manufacturer.manufID} value={manufacturer.manufID}>
                  {manufacturer.manufName}
                </option>
              ))}
            </select>
            {errors.manufID && <p className="text-red-500 text-xs mt-1">{errors.manufID}</p>}
          </div>
          
          {/* Category Selection */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Category</label>
            <select
              name="categoryID"
              value={formData.categoryID}
              onChange={handleChange}
              className={`w-full bg-[#1F3A45] rounded p-2 ${errors.categoryID ? 'border border-red-500' : ''}`}
            >
              <option value="">Select Category</option>
              {categories && categories.map(category => (
                <option key={category.categoryID} value={category.categoryID}>
                  {category.categoryType}
                </option>
              ))}
            </select>
            {errors.categoryID && <p className="text-red-500 text-xs mt-1">{errors.categoryID}</p>}
          </div>
          
          {/* Model Count */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Model Count</label>
            <input
              type="number"
              name="modelCount"
              value={formData.modelCount}
              onChange={handleChange}
              min="0"
              className="w-full bg-[#1F3A45] rounded p-2"
              placeholder="Enter model count"
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
              ) : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddModelModal;

