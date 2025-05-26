import React, { useState } from 'react';
import { FaSearch, FaSync, FaPlus, FaUserPlus, FaFileExport, FaTrash } from 'react-icons/fa';
import escLogo from '../assets/ESCLogo.png';

const WorkstationInventory = () => {
  // Employee detail
  const employeeDetail = {
    number: "021",
    name: "Alyssa Isuan",
    username: "AIsuan",
    department: "Alliance - IT",
    company: "Alliance"
  };

  // Sample data for the table 
  const [assets, setAssets] = useState([
    { id: 1, name: 'Microsoft 365', username: 'scayetano', department: 'IT', assigned: 6, dateAdded: 'Feb. 2, 2024' },
    { id: 2, name: 'BENQ', username: 'scayetano', department: 'IT', assigned: 6, dateAdded: 'Feb. 2, 2024' },
    { id: 3, name: 'Logitech', username: 'scayetano', department: 'IT', assigned: 6, dateAdded: 'Feb. 2, 2024' },
  ]);

  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === assets.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(assets.map(asset => asset.id));
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen w-full bg-[#0f1a1f] text-white font-sans">
      <div className="flex w-full h-full">
        {/* Left Sidebar */}
        <aside className="w-64 h-full flex-shrink-0 bg-[#13232c] p-4 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-[#1e4975] w-12 h-12 rounded-md flex items-center justify-center shadow-inner">
              <img src={escLogo} alt="ESC Logo" className="h-8 w-8" />
            </div>
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
              {/* Menu items (keep existing items here) */}
            </div>

            {/* Asset Status Indicators */}
            <div className="h-1 bg-[#273C45] my-3"></div>
            <div className="pl-6 pr-4 space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Ready to Deploy</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-blue-400"></div><span>Onsite (Deployed)</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-cyan-400"></div><span>WFH (Deployed)</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-pink-500"></div><span>Temporarily Deployed</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-orange-400"></div><span>Borrowed by ESC</span></div>
              <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Defective</span></div>
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
          {/* Employee Information Card */}
          <div className="bg-[#13232c] rounded-lg p-4 mb-6 flex items-center space-x-8">
            <div><strong>No.:</strong> {employeeDetail.number}</div>
            <div><strong>Employee Name:</strong> {employeeDetail.name}</div>
            <div><strong>Username:</strong> {employeeDetail.username}</div>
            <div><strong>Department:</strong> {employeeDetail.department}</div>
            <div><strong>Company:</strong> {employeeDetail.company}</div>
          </div>

          {/* Assets Assigned Section */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Assets Assigned to Workstation</h2>
              <div className="flex space-x-2">
                <button className="flex items-center gap-2 bg-[#0f1a1f] border border-[#334955] text-white px-4 py-2 rounded-md hover:bg-[#1a3a4a] transition-colors">
                  <FaSync />
                  <span>Refresh</span>
                </button>
                <button className="flex items-center gap-2 bg-[#0075a2] hover:bg-[#0088bc] text-white px-4 py-2 rounded-md transition-colors">
                  <FaPlus />
                  <span>Assign Assets</span>
                </button>
                <button className="p-2 bg-[#ff3e4e] text-white rounded-md hover:bg-[#e02e3e] transition-colors">
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto bg-[#0f1a1f] rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#13232c] text-left">
                    <th className="p-3 border-b border-gray-700 w-12">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded bg-[#0f1a1f] border-gray-600 accent-[#38b6ff]"
                        checked={selectedItems.length === assets.length && assets.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 border-b border-gray-700">Name</th>
                    <th className="p-3 border-b border-gray-700">Username</th>
                    <th className="p-3 border-b border-gray-700">Department</th>
                    <th className="p-3 border-b border-gray-700 text-center">Assets Assigned</th>
                    <th className="p-3 border-b border-gray-700">Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="border-b border-gray-800 hover:bg-[#182a35] transition-colors">
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default WorkstationInventory;