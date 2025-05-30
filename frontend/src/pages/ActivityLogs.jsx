import React, { useState, useEffect } from 'react';
import axios from '../api';
import escLogo from '../assets/ESCLogo.png';
import escText from '../assets/ESCText.png';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch logs on mount
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/activity-logs');
        // Sort descending by created_at (most recent first)
        const sorted = response.data
          .slice()
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setLogs(sorted);
        setError(null);
      } catch (err) {
        setError('Failed to load activity logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0f1a1f] text-white font-sans">
      {/* Left Sidebar */}
      <aside className="w-54 min-h-screen max-h-screen flex-shrink-0 bg-[#16282F] p-4 flex flex-col flex">
        {/* Logo Section */}
         {/* Logo */}
                   <div className="ml-12 flex items-center gap-2 mb-6">
                     <div className="bg-[#1e4975] w-12 h-12 rounded flex items-center justify-center">
                       <img src={escLogo} alt="ESC Logo" className="h-10 w-10" />
                     </div>
                     <div className="w-18 h-12 rounded flex items-center justify-center">
                       <img src={escText} alt="ESC Text" className="h-16 w-18" />
                     </div>
                   </div>

        {/* Floor Mapping Container */}
        <div className="bg-[#1c3640] rounded-md p-3 mb-4" style={{ width: '220px', height: '70px' }} onClick={() => window.location.href = '/dashboard'}>
            <button className="bg-[#41b853] text-white px-4 py-2 w-full rounded mb-3 font-semibold">
              Floor Mapping
            </button></div>

        {/* Inventories Container */}
        <div className="mb-4">
            <h2 className="text-lg mb-2">Inventories</h2>
            <div className="bg-[#1c3640] rounded-md p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer" onClick={() => window.location.href = '/company'}>
                  <span className="text-gray-400">🏢</span>
                  <span>Companies</span>
                </div>
                <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer" onClick={() => window.location.href = '/department'}>
                  <span className="text-gray-400">👔</span>
                  <span>Departments</span>
                </div>
                <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer" onClick={() => window.location.href = '/employees'}>
                  <span className="text-gray-400">👤</span>
                  <span>Employees</span>
                </div>
                <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer" onClick={() => window.location.href = '/manufacturer'}>
                  <span className="text-gray-400">🏭</span>
                  <span>Manufacturers</span>
                </div>
                <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer" onClick={() => window.location.href = '/categories'}>
                  <span className="text-gray-400">🏷️</span>
                  <span>Categories</span>
                </div>
                <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer" onClick={() => window.location.href = '/model'}>
                  <span className="text-gray-400">💻</span>
                  <span>Models</span>
                </div>
                <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer" onClick={() => window.location.href = '/assets'}>
                  <span className="text-gray-400">📦</span>
                  <span>Assets</span>
                </div>
              </div>
            </div>
          </div>

        {/* Bottom Buttons Container */}
        <div className="mt-auto">
          <div className="flex space-x-2 mb-4">
            {/* Reports button - highlight as current page */}
            <div className="bg-[#41b853] py-1 px-2 rounded flex-1 flex items-center justify-center flex-col">
              <span className="text-base mb-1 leading-none text-white">📊</span>
              <span className="text-[0.65rem] leading-tight text-white">Reports</span>
            </div>
            <div className="bg-[#1c3640] py-1 px-2 rounded flex-1 flex items-center justify-center flex-col">
              <span className="text-base mb-1 leading-none">💾</span>
              <span className="text-[0.65rem] leading-tight">Backup</span>
            </div>
          </div>

        {/* Divider between About/Logout and Assets */}
            <div className="h-1 bg-[#273C45] my-2"></div>

            <button
              onClick={() => navigate('/')}
              className="bg-[#273C45] text-white py-3 px-4 rounded-xl text-sm font-semibold w-full mt-4 border-4"
              style={{ borderColor: '#273C45' }}
            >
              Log Out
            </button>
          </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Activity Logs</h1>
        </div>
        {/* Error */}
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4">
            {error}
          </div>
        )}
        {/* Loading */}
        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#38b6ff]"></div>
          </div>
        )}
        {/* Table */}
        <div className="bg-[#16282F] rounded-md overflow-x-auto">
          <div className="bg-[#13232c] grid grid-cols-6 py-3 px-4 text-gray-300 min-w-max">
            <div>Action</div>
            <div>Table</div>
            <div>Record ID</div>
            <div>User</div>
            <div>Description</div>
            <div>Date</div>
          </div>
          {logs.length === 0 && !loading ? (
            <div className="py-4 px-4 text-center text-gray-400">
              No activity logs found.
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="grid grid-cols-6 py-3 px-4 border-b border-[#1e2d36] hover:bg-[#182a35] transition-colors min-w-max"
              >
                <div>{log.action_type}</div>
                <div>{log.table_name}</div>
                <div>{log.record_id}</div>
                <div>{log.performed_by}</div>
                <div>{log.description}</div>
                <div>
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default ActivityLogs;