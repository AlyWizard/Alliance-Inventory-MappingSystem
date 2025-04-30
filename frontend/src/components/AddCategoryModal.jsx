import React, { useState } from 'react';
import axios from '../api';

const AddCategoryModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    categoryName: '',
    categoryType: '',
    categoryCount: 0,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Predefined category types - now removed since we're using text input
  // const categoryTypes = [
  //   'Computer',
  //   'Laptop',
  //   'Monitor',
  //   'Peripheral',
  //   'Networking',
  //   'Storage',
  //   'Mobile',
  //   'Hardware',
  //   'Software',
  //   'Office Equipment',
  //   'Furniture',
  //   'Other'
  // ];

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
    
    if (!formData.categoryName.trim()) newErrors.categoryName = 'Category name is required';
    if (!formData.categoryType.trim()) newErrors.categoryType = 'Category type is required';
    
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
        categoryName: formData.categoryName.trim(),
        categoryType: formData.categoryType.trim(),
        categoryCount: parseInt(formData.categoryCount) || 0, // Use admin-provided value
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      
      const response = await axios.post('/api/categories', payload);
      
      setLoading(false);
      onSuccess(response.data);
      resetForm();
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Error creating category:', error);
      
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Failed to create category. Please try again.' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      categoryName: '',
      categoryType: '',
      categoryCount: 0
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
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
            </svg>
            Add Category
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
          {/* Category Name */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Category Name</label>
            <input
              type="text"
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
              className={`w-full bg-[#1F3A45] rounded p-2 ${errors.categoryName ? 'border border-red-500' : ''}`}
              placeholder="Enter category name"
            />
            {errors.categoryName && <p className="text-red-500 text-xs mt-1">{errors.categoryName}</p>}
          </div>
          
          {/* Category Type - Now as text input */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Category Type</label>
            <input
              type="text"
              name="categoryType"
              value={formData.categoryType}
              onChange={handleChange}
              className={`w-full bg-[#1F3A45] rounded p-2 ${errors.categoryType ? 'border border-red-500' : ''}`}
              placeholder="Enter category type"
            />
            {errors.categoryType && <p className="text-red-500 text-xs mt-1">{errors.categoryType}</p>}
            <p className="text-gray-400 text-xs mt-1">This value will be reflected in the asset management system.</p>
          </div>
          
          {/* Category Count */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Category Count</label>
            <input
              type="number"
              name="categoryCount"
              value={formData.categoryCount}
              onChange={handleChange}
              min="0"
              className="w-full bg-[#1F3A45] rounded p-2"
              placeholder="Enter category count"
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

export default AddCategoryModal;