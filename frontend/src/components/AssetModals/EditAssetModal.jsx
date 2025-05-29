import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditAssetModal = ({ isOpen, onClose, onSuccess, asset }) => {
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
    workStationID: null
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDeleted, setImageDeleted] = useState(false); // NEW: Track if image should be deleted
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Status options with their corresponding colors
  const statusOptions = [
    { value: 'Ready to Deploy', color: 'bg-green-500' },
    { value: 'Onsite', color: 'bg-blue-400' },
    { value: 'WFH', color: 'bg-cyan-400' },
    { value: 'Temporarily Deployed', color: 'bg-pink-500' },
    { value: 'Borrowed', color: 'bg-orange-400' },
    { value: 'Defective', color: 'bg-red-500' }
  ];

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clear all image state when modal closes
      setImage(null);
      setImagePreview(null);
      setImageDeleted(false);
      setErrors({});
    }
  }, [isOpen]);

  // Set form data when asset prop changes
  useEffect(() => {
    if (asset && isOpen) {
      console.log("Setting form data from asset:", asset);
      setFormData({
        assetName: asset.assetName || '',
        assetTag: asset.assetTag || '',
        serialNo: asset.serialNo || '',
        modelID: asset.modelID || '',
        categoryID: asset.categoryID || '',
        assetStatus: asset.assetStatus || 'Ready to Deploy',
        isBorrowed: asset.isBorrowed === 1 || false,
        borrowEmployeeID: asset.borrowEmployeeID || '',
        borrowStartDate: asset.borrowStartDate ? asset.borrowStartDate.split('T')[0] : '',
        borrowEndDate: asset.borrowEndDate ? asset.borrowEndDate.split('T')[0] : '',
        workStationID: asset.workStationID || null
      });
      
      // Reset all image state
      setImage(null);
      setImageDeleted(false);
      
      // Set image preview if asset has an image
      if (asset.imagePath) {
        setImagePreview(`http://localhost:3001/uploads/assets/${asset.imagePath}`);
      } else {
        setImagePreview(null);
      }
    }
  }, [asset, isOpen]);

  useEffect(() => {
    // Fetch models, categories, and employees when modal opens
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Fetch data when borrowEmployeeID changes
  useEffect(() => {
    if (formData.borrowEmployeeID) {
      fetchWorkstations(formData.borrowEmployeeID);
    }
  }, [formData.borrowEmployeeID]);

  const fetchData = async () => {
    try {
      console.log('Fetching data for edit modal...');
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
      setErrors({ general: 'Failed to load data. Please try again.' });
    }
  };

  const fetchWorkstations = async (employeeId) => {
    if (!employeeId) return;

    try {
      console.log(`Fetching workstations for employee ID: ${employeeId}`);
      const response = await axios.get(`/api/employees/${employeeId}/workstations`);
      console.log('Workstations found:', response.data);
      setWorkstations(response.data);
    } catch (error) {
      console.error('Error fetching workstations:', error);
    }
  };

  // Updated close handler
  const handleClose = () => {
    // Reset all image-related state
    setImage(null);
    setImagePreview(null);
    setImageDeleted(false);
    setErrors({});
    onClose();
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

  // Handle model change and auto-update category
  const handleModelChange = (e) => {
    const selectedModelID = e.target.value;
    const selectedModel = models.find(model => model.modelID.toString() === selectedModelID);
    
    setFormData({
      ...formData,
      modelID: selectedModelID,
      categoryID: selectedModel ? selectedModel.categoryID : formData.categoryID
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
      setImage(file);
      setImageDeleted(false); // Reset deletion flag when new image is selected
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Updated image removal handler
  const handleImageRemove = () => {
    setImage(null);
    setImagePreview(null);
    setImageDeleted(true); // Mark image for deletion
    console.log('Image marked for deletion');
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Make these fields optional as per requirements
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Updated handleSubmit with image deletion support
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Handle image logic
      let newImagePath = null;
      let shouldUpdateImage = false;
      
      if (image) {
        // User uploaded a new image
        try {
          const formDataImage = new FormData();
          formDataImage.append('image', image);
          
          console.log('Uploading new image...');
          const imageRes = await axios.post('/api/assets/upload-image', formDataImage, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          newImagePath = imageRes.data.path;
          shouldUpdateImage = true;
          console.log('New image uploaded:', newImagePath);
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          setErrors({ general: `Image upload failed: ${imageError.response?.data?.error || imageError.message}` });
          setLoading(false);
          return;
        }
      } else if (imageDeleted) {
        // User deleted the image
        newImagePath = null;
        shouldUpdateImage = true;
        console.log('Image will be deleted from asset');
      }
      
      // Build payload
      const payload = {
        ...formData,
        assetName: formData.assetName?.trim() || null,
        serialNo: formData.serialNo?.trim() || null,
        isBorrowed: formData.isBorrowed ? 1 : 0,
        borrowStartDate: formData.isBorrowed ? formData.borrowStartDate : null,
        borrowEndDate: formData.isBorrowed ? formData.borrowEndDate : null,
        borrowEmployeeID: formData.isBorrowed ? formData.borrowEmployeeID : null,
        workStationID: formData.workStationID || null
      };
      
      // Handle image update/deletion
      if (shouldUpdateImage) {
        payload.imagePath = newImagePath; // This will be null if deleting
        payload.imageUpdated = true;
        console.log('Image will be updated/deleted. New path:', newImagePath || 'DELETED');
      } else {
        payload.imageUpdated = false; // Keep existing image
        console.log('Image will remain unchanged');
      }
      
      console.log('Updating asset with payload:', payload);
      const response = await axios.put(`/api/assets/${asset.assetID}`, payload);
      console.log('Asset updated:', response.data);
      
      setLoading(false);
      onSuccess(response.data);
      handleClose();
    } catch (error) {
      setLoading(false);
      console.error('Error updating asset:', error);
      
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          setErrors(error.response.data.errors);
        } else {
          setErrors({ 
            general: `Update failed: ${error.response.data.message || error.response.data.error || 'Unknown error'}` 
          });
        }
      } else {
        setErrors({ 
          general: `Update failed: ${error.message || 'Network error - please check your connection'}` 
        });
      }
    }
  };

  if (!isOpen || !asset) return null;

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
            Edit Asset
          </h2>
          <button 
            onClick={handleClose}
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
                <div className="relative">
                  <select
                    name="modelID"
                    value={formData.modelID}
                    onChange={handleModelChange}
                    className={`w-full bg-[#1F3A45] rounded p-2 pr-8 appearance-none ${errors.modelID ? 'border border-red-500' : ''}`}
                  >
                    <option value="">Select Model</option>
                    {models.map(model => (
                      <option key={model.modelID} value={model.modelID}>
                        {model.modelName} - {model.manufacturerName || model.manufName} ({model.categoryType})
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
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src={imagePreview} 
                        alt="Asset preview" 
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          console.log("Image failed to load:", imagePreview);
                          e.target.style.display = 'none';
                        }}
                      />
                      <button 
                        type="button"
                        onClick={handleImageRemove} // Updated to use new handler
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        title="Remove image"
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
                {imageDeleted && (
                  <div className="mt-1 text-xs text-yellow-400 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Image will be removed when you save
                  </div>
                )}
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
                            {`${employee.empFirstName} ${employee.empLastName} - ${employee.empCode || employee.empID}`}
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
              ) : 'Update Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssetModal;