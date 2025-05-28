// Company.jsx
import React, { useState, useEffect } from 'react';
import { FaSearch, FaSyncAlt, FaPlus, FaFileExport, FaTrash, FaEdit, FaFilter } from 'react-icons/fa';
import axios from '../api';
import AddCompanyModal from '../components/CompanyModals/AddCompanyModal';
import EditCompanyModal from '../components/CompanyModals/EditCompanyModal';

const Company = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/companies');
      setCompanies(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load companies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredCompanies.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredCompanies.map(company => company.compID));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedItems.length) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected company(ies)?`)) {
      setLoading(true);
      try {
        await Promise.all(selectedItems.map(id => 
          axios.delete(`/api/companies/${id}`)
        ));
        fetchCompanies();
        setSelectedItems([]);
      } catch (err) {
        setError('Failed to delete companies. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSingleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/companies/${id}`);
        fetchCompanies();
        setSelectedItems(selectedItems.filter(item => item !== id));
      } catch (err) {
        setError('Failed to delete company. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (company) => {
    setCurrentCompany(company);
    setIsEditModalOpen(true);
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = (
      company.compName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.compAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesSearch;
  });

  const handleCompanyAdded = (newCompany) => {
    setCompanies([newCompany, ...companies]);
  };

  const handleCompanyUpdated = (updatedCompany) => {
    setCompanies(companies.map(comp => 
      comp.compID === updatedCompany.compID ? updatedCompany : comp
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex min-h-screen bg-[#0f1a1f] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#13232c]">
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

        <div className="px-4 mb-6">
          <div className="rounded-md border border-[#273C45] overflow-hidden" onClick={() => window.location.href = '/dashboard'}>
            <button className="w-full py-3 px-4 bg-[#16282F] text-[#38b6ff] text-left">
              Floor Mapping
            </button>
          </div>
        </div>

        <div className="px-4 mb-3 text-gray-400 font-medium">
          Inventories
        </div>

        <div className="mx-4 bg-[#16282F] rounded-md mb-6 border border-[#273C45] overflow-hidden">
          <div className="p-2 space-y-1">
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded cursor-pointer" onClick={() => window.location.href = '/employees'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M17 2L12 7 7 2"></path>
              </svg>
              <span>Employees</span>
            </div>
            
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded cursor-pointer" onClick={() => window.location.href = '/department'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Departments</span>
            </div>
            
            <div className="bg-[#38b6ff] text-white rounded flex items-center gap-2 p-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>Companies</span>
            </div>
          </div>

          <div className="h-px bg-[#273C45]"></div>

          <div className="p-2 space-y-1">
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded cursor-pointer" onClick={() => window.location.href = '/manufacturer'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <span>Manufacturers</span>
            </div>
            
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded cursor-pointer" onClick={() => window.location.href = '/categories'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
              <span>Categories</span>
            </div>
            
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded cursor-pointer" onClick={() => window.location.href = '/model'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Models</span>
            </div>
          </div>

          <div className="h-px bg-[#273C45]"></div>

          <div className="p-2">
            <div className="text-white flex items-center gap-2 p-2 hover:bg-[#1a3a4a] rounded cursor-pointer" onClick={() => window.location.href = '/assets'}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span>Assets</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Companies</h1>
          <div className="flex gap-2 items-center">
            <button 
              className="bg-[#13232c] border border-[#273C45] rounded-md w-8 h-8 flex items-center justify-center"
              onClick={fetchCompanies}
            >
              <FaSyncAlt className="w-4 h-4" />
            </button>
            
            <button 
              className="bg-[#13232c] border border-[#273C45] rounded-md flex items-center gap-1.5 px-3 py-1 text-[#38b6ff]"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FaPlus className="text-sm" />
              <span>Add</span>
            </button>
            
            <button className="bg-[#41b853] rounded-md flex items-center gap-1.5 px-3 py-1">
              <FaFileExport className="w-4 h-4" />
              <span>EXPORT</span>
            </button>
            
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
            
            <button 
              className={`bg-[#13232c] border border-[#273C45] rounded-md w-8 h-8 flex items-center justify-center ${selectedItems.length > 0 ? 'text-[#ff3e4e]' : 'text-gray-500'}`}
              onClick={handleBulkDelete}
              disabled={selectedItems.length === 0}
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#38b6ff]"></div>
          </div>
        )}
        
        <div className="bg-[#16282F] rounded-md overflow-hidden">
          <div className="bg-[#13232c] grid grid-cols-5 py-3 px-4 text-gray-300">
            <div className="flex items-center">
              <input 
                type="checkbox"
                className="w-4 h-4 bg-transparent border-gray-600 accent-[#38b6ff]"
                checked={selectedItems.length === filteredCompanies.length && filteredCompanies.length > 0}
                onChange={handleSelectAll}
                disabled={filteredCompanies.length === 0}
              />
            </div>
            <div>Company ID</div>
            <div>Company Name</div>
            <div>Address</div>
            <div className="text-center">Actions</div>
          </div>
          
          {filteredCompanies.length === 0 ? (
            <div className="py-4 px-4 text-center text-gray-400">
              {loading ? 'Loading companies...' : 'No companies found.'}
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <div 
                key={company.compID} 
                className="grid grid-cols-5 py-3 px-4 border-b border-[#1e2d36] hover:bg-[#182a35] transition-colors"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 bg-transparent border-gray-600 accent-[#38b6ff]"
                    checked={selectedItems.includes(company.compID)}
                    onChange={() => handleSelect(company.compID)}
                  />
                </div>
                <div>{company.compID.toString().padStart(2, '0')}</div>
                <div>{company.compName}</div>
                <div>{company.compAddress || 'N/A'}</div>
                <div className="flex items-center justify-center space-x-3">
                  <button 
                    onClick={() => handleEdit(company)}
                    className="text-[#38b6ff] hover:text-[#5bc2ff]"
                    title="Edit company"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleSingleDelete(company.compID)}
                    className="text-[#ff3e4e] hover:text-[#ff6b78]"
                    title="Delete company"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>


      {/* Fetch the data from the company */}

      

      <AddCompanyModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCompanyAdded}
      />
        

      {currentCompany && (
        <EditCompanyModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleCompanyUpdated}
          company={currentCompany}
        />
      )}
    </div>
  );
};

export default Company;