import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddAssetModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    assetName: '',
    assetTag: '',
    serialNo: '',
    modelID: '',
    categoryID: '',
    assetStatus: 'Ready to Deploy',
    isBorrowed: false,
    borrowEmployeeID: '',
    borrowStartDate: '',
    borrowEndDate: '',
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Status options with their corresponding colors
  const statusOptions = [
    { value: 'Ready to Deploy', color: 'bg-green-500' },
    { value: 'Onsite', color: 'bg-blue-500' },
    { value: 'WFH', color: 'bg-cyan-500' },
    { value: 'Temporarily Deployed', color: 'bg-pink-500' },
    { value: 'Borrowed', color: 'bg-orange-500' },
    { value: 'Defective', color: 'bg-red-500' }
  ];

  useEffect(() => {
    // Fetch models, categories, and employees when modal opens
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [modelsRes, categoriesRes, employeesRes] = await Promise.all([
        axios.get('/api/models'),
        axios.get('/api/categories'),
        axios.get('/api/employees')
      ]);
      
      setModels(modelsRes.data);
      setCategories(categoriesRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear specific error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.assetName.trim()) newErrors.assetName = 'Asset name is required';
    if (!formData.assetTag.trim()) newErrors.assetTag = 'Asset tag is required';
    if (!formData.serialNo.trim()) newErrors.serialNo = 'Serial number is required';
    if (!formData.modelID) newErrors.modelID = 'Model is required';
    if (!formData.categoryID) newErrors.categoryID = 'Category is required';
    
    if (formData.isBorrowed) {
      if (!formData.borrowEmployeeID) newErrors.borrowEmployeeID = 'Employee is required for borrowed assets';
      if (!formData.borrowStartDate) newErrors.borrowStartDate = 'Start date is required';
      if (!formData.borrowEndDate) newErrors.borrowEndDate = 'End date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // First upload the image if there is one
      let imagePath = null;
      if (image) {
        const formDataImage = new FormData();
        formDataImage.append('image', image);
        
        const imageRes = await axios.post('/api/assets/upload-image', formDataImage, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        imagePath = imageRes.data.path;
      }
      
      // Then create the asset
      const payload = {
        ...formData,
        assetName: formData.assetName.trim(),
        imagePath,
        borrowStartDate: formData.isBorrowed ? formData.borrowStartDate : null,
        borrowEndDate: formData.isBorrowed ? formData.borrowEndDate : null,
      };
      
      const response = await axios.post('/api/assets', payload);
      
      setLoading(false);
      onSuccess(response.data);
      resetForm();
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Error creating asset:', error);
      
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Failed to create asset. Please try again.' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      assetName: '',
      assetTag: '',
      serialNo: '',
      modelID: '',
      categoryID: '',
      assetStatus: 'Ready to Deploy',
      isBorrowed: false,
      borrowEmployeeID: '',
      borrowStartDate: '',
      borrowEndDate: ''
    });
    setImage(null);
    setImagePreview(null);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#25424D] rounded-lg w-full max-w-2xl p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="9" x2="9" y2="21"></line>
            </svg>
            Add Assets
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
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Asset Name</label>
                <input
                  type="text"
                  name="assetName"
                  value={formData.assetName}
                  onChange={handleChange}
                  className={`w-full bg-[#1F3A45] rounded p-2 ${errors.assetName ? 'border border-red-500' : ''}`}
                  placeholder="Enter asset name"
                />
                {errors.assetName && <p className="text-red-500 text-xs mt-1">{errors.assetName}</p>}
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Category</label>
                <div className="relative">
                  <select
                    name="categoryID"
                    value={formData.categoryID}
                    onChange={handleChange}
                    className={`w-full bg-[#1F3A45] rounded p-2 pr-8 appearance-none ${errors.categoryID ? 'border border-red-500' : ''}`}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.categoryID} value={category.categoryID}>
                        {category.categoryType}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                {errors.categoryID && <p className="text-red-500 text-xs mt-1">{errors.categoryID}</p>}
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Model</label>
                <div className="relative">
                  <select
                    name="modelID"
                    value={formData.modelID}
                    onChange={handleChange}
                    className={`w-full bg-[#1F3A45] rounded p-2 pr-8 appearance-none ${errors.modelID ? 'border border-red-500' : ''}`}
                  >
                    <option value="">Select Model</option>
                    {models.map(model => (
                      <option key={model.modelID} value={model.modelID}>
                        {model.modelName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                {errors.modelID && <p className="text-red-500 text-xs mt-1">{errors.modelID}</p>}
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Asset Tag</label>
                <input
                  type="text"
                  name="assetTag"
                  value={formData.assetTag}
                  onChange={handleChange}
                  className={`w-full bg-[#1F3A45] rounded p-2 ${errors.assetTag ? 'border border-red-500' : ''}`}
                  placeholder="Enter asset tag"
                />
                {errors.assetTag && <p className="text-red-500 text-xs mt-1">{errors.assetTag}</p>}
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Serial No.</label>
                <input
                  type="text"
                  name="serialNo"
                  value={formData.serialNo}
                  onChange={handleChange}
                  className={`w-full bg-[#1F3A45] rounded p-2 ${errors.serialNo ? 'border border-red-500' : ''}`}
                  placeholder="Enter serial number"
                />
                {errors.serialNo && <p className="text-red-500 text-xs mt-1">{errors.serialNo}</p>}
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <div className="relative">
                  <select
                    name="assetStatus"
                    value={formData.assetStatus}
                    onChange={handleChange}
                    className="w-full bg-[#1F3A45] rounded p-2 pr-8 appearance-none"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value} className={option.color}>
                        {option.value}
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
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Image</label>
                <div className="relative flex items-center justify-center bg-[#1F3A45] rounded border-dashed border-2 border-gray-500 p-4 h-28">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={imagePreview} 
                        alt="Asset preview" 
                        className="w-full h-full object-contain"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center relative">
                      <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-1 text-xs text-gray-400">
                        Attach Square Image<br />
                        File Here (.png / .jpg)
                      </p>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isBorrowed"
                    checked={formData.isBorrowed}
                    onChange={handleChange}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">Borrow</span>
                </label>
              </div>
              
              {formData.isBorrowed && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">To</label>
                    <div className="relative">
                      <select
                        name="borrowEmployeeID"
                        value={formData.borrowEmployeeID}
                        onChange={handleChange}
                        className={`w-full bg-[#1F3A45] rounded p-2 pr-8 appearance-none ${errors.borrowEmployeeID ? 'border border-red-500' : ''}`}
                      >
                        <option value="">Select Employee</option>
                        {employees.map(employee => (
                          <option key={employee.empID} value={employee.empID}>
                            {`${employee.empFirstName} ${employee.empLastName}`}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {errors.borrowEmployeeID && <p className="text-red-500 text-xs mt-1">{errors.borrowEmployeeID}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">From</label>
                      <input
                        type="date"
                        name="borrowStartDate"
                        value={formData.borrowStartDate}
                        onChange={handleChange}
                        className={`w-full bg-[#1F3A45] rounded p-2 ${errors.borrowStartDate ? 'border border-red-500' : ''}`}
                      />
                      {errors.borrowStartDate && <p className="text-red-500 text-xs mt-1">{errors.borrowStartDate}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Until</label>
                      <input
                        type="date"
                        name="borrowEndDate"
                        value={formData.borrowEndDate}
                        onChange={handleChange}
                        className={`w-full bg-[#1F3A45] rounded p-2 ${errors.borrowEndDate ? 'border border-red-500' : ''}`}
                      />
                      {errors.borrowEndDate && <p className="text-red-500 text-xs mt-1">{errors.borrowEndDate}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {errors.general && (
            <div className="mt-4 p-2 bg-red-500 bg-opacity-20 rounded">
              <p className="text-red-500 text-sm">{errors.general}</p>
            </div>
          )}
          
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0075A2] hover:bg-[#0088BC] text-white py-2 px-6 rounded-md transition-colors flex items-center justify-center min-w-[100px]"
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

export default AddAssetModal;