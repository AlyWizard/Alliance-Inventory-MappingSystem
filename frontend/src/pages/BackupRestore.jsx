import React, { useState, useEffect } from 'react';
import axios from '../api';
import { Save, RotateCcw } from 'lucide-react';
import escLogo from '../assets/ESCLogo.png';
import escText from '../assets/ESCText.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function BackupRestore() {
  // Track selected backups by filename
  const [selectedBackups, setSelectedBackups] = useState([]);
  const [backups, setBackups] = useState([]);

  useEffect(() => {
    const fetchBackups = async () => {
      try {
        const res = await axios.get('/api/backups');
        setBackups(res.data);
      } catch (error) {
        console.error("Failed to fetch backups:", error);
      }
    };
    fetchBackups();
  }, []);

  const handleBackup = async () => {
    try {
      const response = await axios.post('/api/backup');
      // The backend returns either response.data.fileName or response.data.filename
      const newFileName = response.data.fileName || response.data.filename;
      toast.success('ESC Backup created successfully 🎉', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
      });
      // window.location.reload();
      // Update backups state directly by appending new backup object
      setBackups(prev => [
        ...prev,
        {
          filename: newFileName,
          date: new Date().toISOString(),
        }
      ]);
    } catch (err) {
      console.error('Backup error:', err);
      toast.error('Backup failed. Please try again.');
    }
  };

  // Delete selected backup files
  const handleDeleteSelected = async () => {
    if (selectedBackups.length === 0) return;
    if (!window.confirm('Are you sure you want to delete the selected backup(s)?')) return;
    try {
      // For each selected filename, send a delete request
      for (const filename of selectedBackups) {
        await axios.delete(`/api/backups/${encodeURIComponent(filename)}`);
      }
      // Remove deleted backups from state
      setBackups(prev => prev.filter(b => !selectedBackups.includes(b.filename)));
      setSelectedBackups([]);
      toast.success('Backup(s) deleted successfully 🗑️', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
      });
      // Optionally reload, if needed
      // window.location.reload();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete selected backup(s).');
    }
  };

  // Restore backup file
  const handleRestore = async () => {
    if (selectedBackups.length !== 1) return;

    const confirmed = window.confirm(`Are you sure you want to restore from ${selectedBackups[0]}?`);
    if (!confirmed) return;

    try {
      await axios.post('/api/restore', { filename: selectedBackups[0] });
      toast.success('System restored successfully from backup.');
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Restore failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1a1f] text-white font-sans">
      {/* Left Sidebar */}
      <aside className="w-54 min-h-screen max-h-screen flex-shrink-0 bg-[#16282F] p-4 flex flex-col flex">
        {/* Logo Section */}
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
          </button>
        </div>

        {/* Inventories Container */}
        <div className="mb-4">
          <h2 className="text-lg mb-2">Inventories</h2>
          <div className="bg-[#1c3640] rounded-md p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer" onClick={() => window.location.href = '/companies'}>
                <span className="text-gray-400">🏢</span>
                <span>Companies</span>
              </div>
              <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer" onClick={() => window.location.href = '/departments'}>
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
            <div className="bg-[#1c3640] py-1 px-2 rounded flex-1 flex items-center justify-center flex-col">
              <span className="text-base mb-1 leading-none">📊</span>
              <span className="text-[0.65rem] leading-tight">Reports</span>
            </div>
            <div className="bg-[#41b853] py-1 px-2 rounded flex-1 flex items-center justify-center flex-col">
              <span className="text-base mb-1 leading-none text-white">💾</span>
              <span className="text-[0.55rem] leading-tight text-white">Backup & Restore</span>
            </div>
          </div>

          <div className="h-1 bg-[#273C45] my-2"></div>

          <button
            onClick={() => window.location.href = '/'}
            className="bg-[#273C45] text-white py-3 px-4 rounded-xl text-sm font-semibold w-full mt-4 border-4"
            style={{ borderColor: '#273C45' }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        <div className="bg-[#16282F] p-6 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Backup and Restore</h1>
            <div className="flex gap-3">
              <button
                onClick={handleBackup}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  selectedBackups.length > 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#2196F3] hover:bg-[#1976D2]'
                }`}
                disabled={selectedBackups.length > 0}
              >
                <Save size={20} />
                Back Up
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  selectedBackups.length !== 1 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-[#2196F3] hover:bg-[#1976D2]'
                }`}
                disabled={selectedBackups.length !== 1}
                onClick={handleRestore}
              >
                <RotateCcw size={20} />
                Restore
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold ${
                  selectedBackups.length === 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={selectedBackups.length === 0}
                onClick={handleDeleteSelected}
              >
                Delete Selected
              </button>
            </div>
          </div>

          <div className="bg-[#273C45] rounded-lg overflow-hidden">
            
            <table className="w-full">
              <thead className="bg-[#0B1519] text-white">
                <tr>
                  <th className="px-4 py-2"></th>
                  <th className="px-4 py-2 text-left">File Name</th>
                  <th className="px-4 py-2 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-slate-400">No backups found</td>
                  </tr>
                ) : (
                  backups.map((backup, index) => (
                    <tr key={index} className="border-t border-slate-700">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedBackups.includes(backup.filename)}
                          onChange={() => {
                            setSelectedBackups(prev =>
                              prev.includes(backup.filename)
                                ? prev.filter(f => f !== backup.filename)
                                : [...prev, backup.filename]
                            );
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 text-white">{backup.filename}</td>
                      <td className="px-4 py-2 text-white">{new Date(backup.date).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Toast notifications */}
        <ToastContainer />
      </main>
    </div>
  );
}

export default BackupRestore;