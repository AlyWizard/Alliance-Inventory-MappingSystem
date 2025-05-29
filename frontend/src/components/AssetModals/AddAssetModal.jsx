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
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

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
    // Fetch models and employees when modal opens
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showModelDropdown && !event.target.closest('.model-dropdown')) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelDropdown]);

  const fetchData = async () => {
    try {
      console.log('Fetching models and employees...');
      const [modelsRes, employeesRes] = await Promise.all([
        axios.get('http://localhost:3001/api/models'),
        axios.get('http://localhost:3001/api/employees')
      ]);
      
      console.log('Models fetched:', modelsRes.data);
      console.log('Employees fetched:', employeesRes.data);
      
      setModels(modelsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrors({ general: 'Failed to load data. Please try again.' });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    console.log(`Field changed: ${name} = ${newValue}`);
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Clear specific error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleModelChange = (selectedModelID) => {
    console.log('Selected model ID:', selectedModelID);
    const selectedModel = models.find(model => model.modelID.toString() === selectedModelID.toString());
    console.log('Selected model:', selectedModel);
    
    setFormData({
      ...formData,
      modelID: selectedModelID,
      categoryID: selectedModel ? selectedModel.categoryID : ''
    });
    
    // Clear model error if exists
    if (errors.modelID) {
      setErrors({
        ...errors,
        modelID: null
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Image selected:', file.name, file.size);
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
    
    console.log('Validating form data:', formData);
    
    // Asset name is optional
    if (!formData.assetTag.trim()) newErrors.assetTag = 'Asset tag is required';
    if (!formData.modelID) newErrors.modelID = 'Model is required';
    
    if (formData.isBorrowed) {
      if (!formData.borrowEmployeeID) newErrors.borrowEmployeeID = 'Employee is required for borrowed assets';
      if (!formData.borrowStartDate) newErrors.borrowStartDate = 'Start date is required';
      if (!formData.borrowEndDate) newErrors.borrowEndDate = 'End date is required';
      
      // Validate that end date is after start date
      if (formData.borrowStartDate && formData.borrowEndDate) {
        const startDate = new Date(formData.borrowStartDate);
        const endDate = new Date(formData.borrowEndDate);
        if (endDate <= startDate) {
          newErrors.borrowEndDate = 'End date must be after start date';
        }
      }
    }
    
    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // First upload the image if there is one
      let imagePath = null;
      if (image) {
        console.log('Uploading image...');
        try {
          const formDataImage = new FormData();
          formDataImage.append('image', image);
          
          const imageRes = await axios.post('http://localhost:3001/api/assets/upload-image', formDataImage, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          console.log('Image upload response:', imageRes.data);
          imagePath = imageRes.data.path;
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          setErrors({ general: `Image upload failed: ${imageError.response?.data?.message || imageError.message}` });
          setLoading(false);
          return;
        }
      }
      
      // Then create the asset
      const payload = {
        assetName: formData.assetName.trim() || null,
        assetTag: formData.assetTag.trim(),
        serialNo: formData.serialNo.trim() || null,
        modelID: formData.modelID,
        categoryID: formData.categoryID,
        assetStatus: formData.assetStatus,
        imagePath,
        isBorrowed: formData.isBorrowed,
        borrowStartDate: formData.isBorrowed ? formData.borrowStartDate : null,
        borrowEndDate: formData.isBorrowed ? formData.borrowEndDate : null,
        borrowEmployeeID: formData.isBorrowed ? formData.borrowEmployeeID : null,
      };
      
      console.log('Sending asset payload:', payload);
      
      const response = await axios.post('http://localhost:3001/api/assets', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Asset creation response:', response.data);
      
      setLoading(false);
      onSuccess(response.data);
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Asset creation error:', error);
      setLoading(false);
      
      if (error.response && error.response.data) {
        console.log('Error response data:', error.response.data);
        if (error.response.data.errors) {
          setErrors(error.response.data.errors);
        } else {
          setErrors({ 
            general: `Asset creation failed: ${error.response.data.message || error.response.data.error || 'Unknown error'}` 
          });
        }
      } else {
        setErrors({ 
          general: `Asset creation failed: ${error.message || 'Network error - please check your connection'}` 
        });
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
    setModelSearch('');
    setShowModelDropdown(false);
  };

  // Filter models based on search
  const filteredModels = models.filter(model => {
    if (!modelSearch) return true; // Show all models when no search term
    return (
      model.modelName.toLowerCase().includes(modelSearch.toLowerCase()) ||
      model.manufacturerName?.toLowerCase().includes(modelSearch.toLowerCase()) ||
      model.categoryName?.toLowerCase().includes(modelSearch.toLowerCase())
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#25424D] rounded-lg w-full max-w-4xl p-6 text-white max-h-[90vh] overflow-y-auto">
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
                <label className="block text-gray-400 text-sm mb-1">Asset Name <span className="text-gray-500">(Optional)</span></label>
                <input
                  type="text"
                  name="assetName"
                  value={formData.assetName}
                  onChange={handleChange}
                  className="w-full bg-[#1F3A45] rounded p-2"
                  placeholder="Enter asset name"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Model <span className="text-red-400">*</span></label>
                <div className="relative model-dropdown">
                  <input
                    type="text"
                    placeholder="Type to search and select model..."
                    value={modelSearch}
                    onChange={(e) => {
                      setModelSearch(e.target.value);
                      setShowModelDropdown(true);
                    }}
                    onFocus={() => setShowModelDropdown(true)}
                    className={`w-full bg-[#1F3A45] rounded p-2 ${errors.modelID ? 'border border-red-500' : ''}`}
                  />
                  
                  {showModelDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-[#1F3A45] border border-[#273C45] rounded-md mt-1 z-50 max-h-48 overflow-y-auto shadow-lg">
                      {filteredModels.length > 0 ? (
                        filteredModels.map(model => (
                          <div
                            key={model.modelID}
                            className="p-2 hover:bg-[#273C45] cursor-pointer text-sm"
                            onClick={() => {
                              console.log('Model clicked:', model);
                              handleModelChange(model.modelID);
                              setModelSearch(`${model.modelName} - ${model.manufacturerName}`);
                              setShowModelDropdown(false);
                            }}
                          >
                            {model.modelName} - {model.manufacturerName} ({model.categoryType})
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-400 text-sm">
                          {models.length === 0 ? 'Loading models...' : 'No models found'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {errors.modelID && <p className="text-red-500 text-xs mt-1">{errors.modelID}</p>}
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Asset Tag <span className="text-red-400">*</span></label>
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
                <label className="block text-gray-400 text-sm mb-1">Serial No. <span className="text-gray-500">(Optional)</span></label>
                <input
                  type="text"
                  name="serialNo"
                  value={formData.serialNo}
                  onChange={handleChange}
                  className="w-full bg-[#1F3A45] rounded p-2"
                  placeholder="Enter serial number"
                />
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
                      <option key={option.value} value={option.value}>
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
                  <span className="ml-2 text-sm">Borrow Asset</span>
                </label>
              </div>
              
              {formData.isBorrowed && (
                <div className="space-y-3 bg-[#1F3A45] p-3 rounded">
                  <div className="text-sm font-medium text-gray-300 border-b border-gray-600 pb-2 mb-3">
                    Borrow Details
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Borrow To <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <select
                        name="borrowEmployeeID"
                        value={formData.borrowEmployeeID}
                        onChange={handleChange}
                        className={`w-full bg-[#13232c] rounded p-2 pr-8 appearance-none ${errors.borrowEmployeeID ? 'border border-red-500' : ''}`}
                      >
                        <option value="">Select Employee</option>
                        {employees.map(employee => (
                          <option key={employee.empID} value={employee.empID}>
                            {`${employee.empFirstName} ${employee.empLastName} - ${employee.empID}`}
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
                      <label className="block text-gray-400 text-xs mb-1">From Date <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        name="borrowStartDate"
                        value={formData.borrowStartDate}
                        onChange={handleChange}
                        className={`w-full bg-[#13232c] rounded p-2 ${errors.borrowStartDate ? 'border border-red-500' : ''}`}
                      />
                      {errors.borrowStartDate && <p className="text-red-500 text-xs mt-1">{errors.borrowStartDate}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Until Date <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        name="borrowEndDate"
                        value={formData.borrowEndDate}
                        onChange={handleChange}
                        className={`w-full bg-[#13232c] rounded p-2 ${errors.borrowEndDate ? 'border border-red-500' : ''}`}
                      />
                      {errors.borrowEndDate && <p className="text-red-500 text-xs mt-1">{errors.borrowEndDate}</p>}
                    </div>
                  </div>
                  
                  {formData.borrowEmployeeID && formData.borrowStartDate && formData.borrowEndDate && (
                    <div className="mt-3 p-2 bg-[#13232c] rounded text-xs">
                      <div className="text-gray-300 font-medium mb-1">Borrow Summary:</div>
                      <div className="text-gray-400">
                        <div>Employee: {employees.find(emp => emp.empID.toString() === formData.borrowEmployeeID)?.empFirstName} {employees.find(emp => emp.empID.toString() === formData.borrowEmployeeID)?.empLastName}</div>
                        <div>Period: {formData.borrowStartDate} to {formData.borrowEndDate}</div>
                        <div>Duration: {Math.ceil((new Date(formData.borrowEndDate) - new Date(formData.borrowStartDate)) / (1000 * 60 * 60 * 24))} days</div>
                      </div>
                    </div>
                  )}
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
              ) : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;