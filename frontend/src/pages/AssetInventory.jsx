import React, { useState } from 'react';
import { FaSearch, FaSync, FaPlus, FaUserPlus, FaFileExport, FaTrash } from 'react-icons/fa';
import escLogo from '../assets/ESCLogo.png';

const AssetInventory = () => {
  // Sample data for the table
  const [assets, setAssets] = useState([
    { id: 1, name: 'Test Asset 1', username: 'testuser', department: 'Testing', assigned: 0, dateAdded: 'N/A' },
    { id: 2, name: 'Test Asset 2', username: 'testuser', department: 'Testing', assigned: 0, dateAdded: 'N/A' },
    { id: 3, name: 'Test Asset 3', username: 'testuser', department: 'Testing', assigned: 0, dateAdded: 'N/A' },
  ]);

  // State for selected items
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    if (selectedItems.length === assets.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(assets.map(asset => asset.id));
    }
  };

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full flex bg-[#0f1a1f] text-white font-sans">
      {/* Left Sidebar */}
      <aside className="w-64 min-h-screen flex-shrink-0 bg-[#13232c] p-4 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          {/* Logo Icon */}
          <div className="bg-[#1e4975] w-12 h-12 rounded-md flex items-center justify-center shadow-inner">
            <img src={escLogo} alt="ESC Logo" className="h-8 w-8" />
          </div>

          {/* Text beside logo */}
          <div className="text-[#41b853] leading-tight">
            <h1 className="text-2xl font-bold">Esc</h1>
            <span className="text-xs tracking-widest text-[#41b853]">CORPORATION</span>
          </div>
        </div>

        {/* Floor Mapping Button */}
        <div className="mb-8 border rounded-md" style={{ borderColor: '#273C45', backgroundColor: '#16282F' }}>
          <button className="text-[#38b6ff] py-2 px-4 w-full text-left">
            Floor Mapping
          </button>
        </div>

        {/* Inventories Section */}
        <h2 className="text-gray-400 mb-4 pl-4">Inventories</h2>
        <div className="mb-6 border" style={{ borderColor: '#273C45', backgroundColor: '#16282F' }}>
          <div className="space-y-3 pl-4 pr-4 pt-4">
            <div className="flex items-center gap-3 hover:text-[#38b6ff] cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Employees</span>
            </div>
            <div className="flex items-center gap-3 hover:text-[#38b6ff] cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Departments</span>
            </div>
            <div className="flex items-center gap-3 hover:text-[#38b6ff] cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Companies</span>
            </div>
            <div className="flex items-center gap-3 hover:text-[#38b6ff] cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>Manufacturers</span>
            </div>
            <div className="flex items-center gap-3 hover:text-[#38b6ff] cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>Categories</span>
            </div>
            <div className="flex items-center gap-3 hover:text-[#38b6ff] cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Models</span>
            </div>
            <div className="flex items-center gap-3 text-[#38b6ff] cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="9" x2="9" y2="21"></line>
              </svg>
              <span>Assets</span>
            </div>
          </div>

          {/* Asset Status Indicators */}
          <div className="h-1 bg-[#273C45] my-3"></div>
          <div className="pl-6 pr-4 space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Ready to Deploy</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span>Onsite (Deployed)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              <span>WFH (Deployed)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span>Temporarily Deployed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span>Borrowed by ESC</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Defective</span>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="mt-auto flex gap-2">
          <div className="bg-[#1a3a4a] p-2 rounded flex-1 flex items-center justify-center flex-col">
            <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span className="text-xs">Activity Reports</span>
          </div>
          <div className="bg-[#1a3a4a] p-2 rounded flex-1 flex items-center justify-center flex-col">
            <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span className="text-xs">Backup & Restore</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6">
        {/* Action Bar with Buttons and Search */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          {/* Left side buttons */}
          <div className="flex gap-2 flex-wrap">
            <button className="p-2 border border-[#38b6ff] text-white rounded-md hover:bg-[#1a3a4a] transition-colors">
              Refresh
            </button>
            <button className="flex items-center gap-2 bg-[#0075a2] hover:bg-[#0088bc] text-white px-4 py-2 rounded-md transition-colors">
              <FaPlus size={12} />
              <span>Add</span>
            </button>
            <button className="flex items-center gap-2 bg-[#0075a2] hover:bg-[#0088bc] text-white px-4 py-2 rounded-md transition-colors">
              <FaUserPlus size={12} />
              <span>Assign</span>
            </button>
          </div>

          {/* Right side search and controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-48">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Here" 
                className="bg-[#0f1a1f] text-white pl-10 pr-4 py-2 rounded-full w-full focus:outline-none focus:ring-1 focus:ring-[#38b6ff]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 bg-[#13232c] border border-gray-700 text-white px-4 py-2 rounded-md hover:bg-[#1a3a4a] transition-colors">
              <span>Sort</span>
            </button>
            <button className="flex items-center gap-2 bg-[#00b868] text-white px-4 py-2 rounded-md hover:bg-[#00a05a] transition-colors">
              <FaFileExport size={14} />
              <span>EXPORT</span>
            </button>
            <button className="p-2 bg-[#ff3e4e] text-white rounded-md hover:bg-[#e02e3e] transition-colors">
              <FaTrash />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto bg-[#16282F] p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#13232c] text-left">
                <th className="p-3 border-b border-gray-700 w-12"></th>
                <th className="p-3 border-b border-gray-700">Name</th>
                <th className="p-3 border-b border-gray-700">Username</th>
                <th className="p-3 border-b border-gray-700">Department</th>
                <th className="p-3 border-b border-gray-700 text-center">Assets Assigned</th>
                <th className="p-3 border-b border-gray-700">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr 
                  key={asset.id} 
                  className="border-b border-gray-700 hover:bg-[#1f2f39] hover:shadow-md transition-all duration-200"
                >
                  <td className="p-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded bg-[#0f1a1f] border-gray-600 accent-[#38b6ff]"
                      checked={selectedItems.includes(asset.id)}
                      onChange={() => handleSelect(asset.id)}
                    />
                  </td>
                  <td className="p-3 font-medium">{asset.name}</td>
                  <td className="p-3">{asset.username}</td>
                  <td className="p-3">{asset.department}</td>
                  <td className="p-3 text-center">{asset.assigned}</td>
                  <td className="p-3">{asset.dateAdded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AssetInventory;