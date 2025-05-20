import React, { useState, useEffect } from 'react';
import { FaSearch, FaSyncAlt, FaPlus, FaFileExport, FaTrash, FaEdit, FaFilter } from 'react-icons/fa';
import axios from '../api';
import AddCategoryModal from '../components/CategoriesModals/AddCategoryModal';
import EditCategoryModal from '../components/CategoriesModals/EditCategoryModal';

const Categories = () => {
  // State for categories data
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for selected items
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  
  // State for filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    categoryType: ''
  });

  // Removed predefined category types since we now use free text input
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

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox selection
  const handleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === filteredCategories.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredCategories.map(category => category.categoryID));
    }
  };

  // Handle bulk category deletion
  const handleBulkDelete = async () => {
    if (!selectedItems.length) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected category(s)?`)) {
      setLoading(true);
      try {
        // Delete each selected category
        await Promise.all(selectedItems.map(id => 
          axios.delete(`/api/categories/${id}`)
        ));
        
        // Refresh categories and clear selection
        fetchCategories();
        setSelectedItems([]);
      } catch (err) {
        console.error('Error deleting categories:', err);
        setError('Failed to delete categories. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle single category deletion
  const handleSingleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/categories/${id}`);
        // Refresh categories and remove from selected items if present
        fetchCategories();
        setSelectedItems(selectedItems.filter(item => item !== id));
      } catch (err) {
        console.error('Error deleting category:', err);
        setError('Failed to delete category. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle edit category
  const handleEdit = (category) => {
    setCurrentCategory(category);
    setIsEditModalOpen(true);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      categoryType: ''
    });
    setFilterOpen(false);
  };

  // Filter categories based on search and filters
  const filteredCategories = categories.filter(category => {
    // Search filter
    const matchesSearch = (
      category.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.categoryType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Category type filter - now does a partial match instead of exact match
    const matchesType = filters.categoryType === '' || 
      category.categoryType?.toLowerCase().includes(filters.categoryType.toLowerCase());
    
    return matchesSearch && matchesType;
  });

  // Handle successful category addition
  const handleCategoryAdded = (newCategory) => {
    setCategories([newCategory, ...categories]);
  };

  // Handle successful category update
  const handleCategoryUpdated = (updatedCategory) => {
    setCategories(categories.map(cat => 
      cat.categoryID === updatedCategory.categoryID ? updatedCategory : cat
    ));
  };

  // Format date to match the design
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex min-h-screen bg-[#0f1a1f] text-white font-sans">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#13232c]">
        {/* Logo Section */}
        <div className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#1e4975] w-12 h-12 rounded-md flex items-center justify-center">
              <div className="text-white font-bold text-lg">Esc</div>
            </div>
            <div>
              <div className="text-[#41b853] text-3xl font-bold leading-none">Esc</div>
              <div className="text-[#41b853] text-[10px] tracking-widest">CORPORATION</div>
            </div>
          </div>
        </div>

        {/* Floor Mapping Container */}
        <div className="px-4 mb-6" >
          <div className="rounded-md border border-[#273C45] overflow-hidden"onClick={() => window.location.href = '/dashboard'}>
            <button className="w-full py-3 px-4 bg-[#16282F] text-[#38b6ff] text-left">
              Floor Mapping
            </button>
          </div>
        </div>

        {/* Inventories Header */}
        <div className="px-4 mb-3 text-gray-400 font-medium">
          Inventories
        </div>

        {/* Inventories Container */}
        <div className="mx-4 bg-[#16282F] rounded-md mb-6 border border-[#273C45] overflow-hidden">
          {/* Main Menu Items */}
          <div className="p-2 space-y-1">
            {/* Employees */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/employees'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M17 2L12 7 7 2"></path>
              </svg>
              <span>Employees</span>
            </div>
            
            {/* Departments */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Departments</span>
            </div>
            
            {/* Companies */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>Companies</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#273C45]"></div>

          <div className="p-2 space-y-1">
            {/* Manufacturers */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/manufacturer'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <span>Manufacturers</span>
            </div>
            
            {/* Categories (Active) */}
            <div className="bg-[#38b6ff] text-white rounded flex items-center gap-2 p-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
              <span>Categories</span>
            </div>
            
            {/* Models */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/model'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Models</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#273C45]"></div>

          <div className="p-2">
            {/* Assets */}
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded" onClick={() => window.location.href = '/assets'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>Assets</span>
            </div>
            
            {/* Asset Status Indicators */}
            <div className="pl-6 space-y-1.5 mt-2">
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Ready to Deploy</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-blue-400"></div><span>Onsite (Deployed)</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-cyan-400"></div><span>WFH (Deployed)</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-pink-500"></div><span>Temporarily Deployed</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-orange-400"></div><span>Borrowed by ESC</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Defective</span></div>
            </div>
          </div>
        </div>

        {/* Bottom Buttons Container */}
        <div className="px-4 mt-auto absolute bottom-4 w-64">
          <div className="flex gap-2">
            <button className="bg-[#1a3a4a] p-2 rounded flex-1 flex items-center justify-center flex-col">
              <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span className="text-xs">Activity Reports</span>
            </button>
            <button className="bg-[#1a3a4a] p-2 rounded flex-1 flex items-center justify-center flex-col">
              <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span className="text-xs">Backup & Restore</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        {/* Title Bar Container */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Categories</h1>
          <div className="flex gap-2 items-center">
            {/* Refresh Button */}
            <button 
              className="bg-[#13232c] border border-[#273C45] rounded-md w-8 h-8 flex items-center justify-center"
              onClick={fetchCategories}
            >
              <FaSyncAlt className="w-4 h-4" />
            </button>
            
            {/* Add Button */}
            <button 
              className="bg-[#13232c] border border-[#273C45] rounded-md flex items-center gap-1.5 px-3 py-1 text-[#38b6ff]"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FaPlus className="text-sm" />
              <span>Add</span>
            </button>
            
            {/* Export Button */}
            <button className="bg-[#41b853] rounded-md flex items-center gap-1.5 px-3 py-1">
              <FaFileExport className="w-4 h-4" />
              <span>EXPORT</span>
            </button>
            
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Here"
                className="bg-[#13232c] text-white pl-10 pr-4 py-1.5 rounded-md border border-[#273C45] w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Filter Button */}
            <button 
              className={`bg-[#13232c] border border-[#273C45] rounded-md flex items-center gap-1.5 px-3 py-1 ${filterOpen ? 'text-[#38b6ff]' : ''}`}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <FaFilter className="w-3 h-3" />
              <span>Filter</span>
            </button>
            
            {/* Delete Button */}
            <button 
              className={`bg-[#13232c] border border-[#273C45] rounded-md w-8 h-8 flex items-center justify-center ${selectedItems.length > 0 ? 'text-[#ff3e4e]' : 'text-gray-500'}`}
              onClick={handleBulkDelete}
              disabled={selectedItems.length === 0}
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Filter Panel */}
        {filterOpen && (
          <div className="bg-[#16282F] rounded-md p-4 mb-4 border border-[#273C45]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Filter Options</h3>
              <button 
                onClick={resetFilters}
                className="text-sm text-gray-400 hover:text-white"
              >
                Reset Filters
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* Category Type Filter - Now as text input */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Filter by Category Type</label>
                <input
                  type="text"
                  name="categoryType"
                  value={filters.categoryType}
                  onChange={handleFilterChange}
                  className="w-full bg-[#1F3A45] rounded p-2"
                  placeholder="Enter category type to filter"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#38b6ff]"></div>
          </div>
        )}
        
        {/* Table */}
        <div className="bg-[#16282F] rounded-md overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#13232c] grid grid-cols-7 py-3 px-4 text-gray-300">
            <div className="flex items-center">
              <input 
                type="checkbox"
                className="w-4 h-4 bg-transparent border-gray-600 accent-[#38b6ff]"
                checked={selectedItems.length === filteredCategories.length && filteredCategories.length > 0}
                onChange={handleSelectAll}
                disabled={filteredCategories.length === 0}
              />
            </div>
            <div>Category ID</div>
            <div>Category Name</div>
            <div>Category Type</div>
            <div>Category Count</div>
            <div>Date Created</div>
            <div className="text-center">Actions</div>
          </div>
          
          {/* Table Rows */}
          {filteredCategories.length === 0 ? (
            <div className="py-4 px-4 text-center text-gray-400">
              {loading ? 'Loading categories...' : 'No categories found.'}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div 
                key={category.categoryID} 
                className="grid grid-cols-7 py-3 px-4 border-b border-[#1e2d36] hover:bg-[#182a35] transition-colors"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 bg-transparent border-gray-600 accent-[#38b6ff]"
                    checked={selectedItems.includes(category.categoryID)}
                    onChange={() => handleSelect(category.categoryID)}
                  />
                </div>
                <div>{category.categoryID.toString().padStart(2, '0')}</div>
                <div>{category.categoryName}</div>
                <div>{category.categoryType}</div>
                <div>{category.categoryCount}</div>
                <div>{formatDate(category.created_at)}</div>
                <div className="flex items-center justify-center space-x-3">
                  <button 
                    onClick={() => handleEdit(category)}
                    className="text-[#38b6ff] hover:text-[#5bc2ff]"
                    title="Edit category"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleSingleDelete(category.categoryID)}
                    className="text-[#ff3e4e] hover:text-[#ff6b78]"
                    title="Delete category"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add Category Modal */}
      <AddCategoryModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCategoryAdded}
      />

      {/* Edit Category Modal */}
      <EditCategoryModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleCategoryUpdated}
        category={currentCategory}
      />
    </div>
  );
};

export default Categories;