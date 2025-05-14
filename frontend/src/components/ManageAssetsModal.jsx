import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageAssetModal = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workstations, setWorkstations] = useState([]);
  const [selectedWorkstation, setSelectedWorkstation] = useState('');

  useEffect(() => {
    // Load available assets and workstations when component mounts
    fetchAssets();
    fetchWorkstations();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/assets');
      setAssets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load assets. Please try again.');
      // Mock data for demo
      setAssets([
        { assetID: 1, assetName: 'Dell Monitor', categoryName: 'Monitor', assetTag: 'MON-001', workStationID: null },
        { assetID: 2, assetName: 'HP Laptop', categoryName: 'Computer', assetTag: 'LAP-001', workStationID: 'WSM001' },
        { assetID: 3, assetName: 'Logitech Keyboard', categoryName: 'Peripheral', assetTag: 'KEY-001', workStationID: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkstations = async () => {
    try {
      const response = await axios.get('/api/workstations');
      setWorkstations(response.data);
    } catch (err) {
      console.error('Error fetching workstations:', err);
      // Mock data for demo
      setWorkstations([
        { workStationID: 'WSM001', modelName: 'Workstation 1', empFirstName: 'John', empLastName: 'Doe' },
        { workStationID: 'WSM002', modelName: 'Workstation 2', empFirstName: null, empLastName: null },
        { workStationID: 'WSM003', modelName: 'Workstation 3', empFirstName: 'Jane', empLastName: 'Smith' },
      ]);
    }
  };

  const handleAssetSelection = (assetId) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  const handleAssignAssets = async () => {
    if (!selectedWorkstation || selectedAssets.length === 0) {
      setError('Please select a workstation and at least one asset');
      return;
    }

    try {
      setLoading(true);
      
      // Make API call to assign assets to workstation
      await axios.post('/api/assets/assign', {
        assetIds: selectedAssets,
        workStationID: selectedWorkstation,
        assetStatus: 'Onsite'
      });
      
      // Refresh assets list
      fetchAssets();
      setSelectedAssets([]);
      setError(null);
      alert('Assets assigned successfully!');
    } catch (err) {
      console.error('Error assigning assets:', err);
      setError('Failed to assign assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignAssets = async () => {
    if (selectedAssets.length === 0) {
      setError('Please select at least one asset to unassign');
      return;
    }

    try {
      setLoading(true);
      
      // Make API call to unassign assets
      await axios.post('/api/assets/unassign', {
        assetIds: selectedAssets
      });
      
      // Refresh assets list
      fetchAssets();
      setSelectedAssets([]);
      setError(null);
      alert('Assets unassigned successfully!');
    } catch (err) {
      console.error('Error unassigning assets:', err);
      setError('Failed to unassign assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1a1f] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Assets</h1>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Available Assets */}
        <div className="lg:col-span-2">
          <div className="bg-[#16282F] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Assets</h2>
              <div className="space-x-2">
                <button 
                  onClick={handleAssignAssets}
                  disabled={loading || selectedAssets.length === 0 || !selectedWorkstation}
                  className={`px-3 py-1 rounded ${
                    loading || selectedAssets.length === 0 || !selectedWorkstation
                      ? 'bg-gray-600 text-gray-300'
                      : 'bg-[#41b853] text-white'
                  }`}
                >
                  Assign Selected
                </button>
                <button 
                  onClick={handleUnassignAssets}
                  disabled={loading || selectedAssets.length === 0}
                  className={`px-3 py-1 rounded ${
                    loading || selectedAssets.length === 0
                      ? 'bg-gray-600 text-gray-300'
                      : 'bg-[#e63946] text-white'
                  }`}
                >
                  Unassign Selected
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-t-2 border-b-2 border-[#41b853] rounded-full animate-spin"></div>
                <p className="mt-2">Loading assets...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1c3640]">
                    <tr>
                      <th className="p-3 text-left w-10">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssets(assets.map(asset => asset.assetID));
                            } else {
                              setSelectedAssets([]);
                            }
                          }}
                          checked={selectedAssets.length === assets.length && assets.length > 0}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="p-3 text-left">Asset Name</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Tag</th>
                      <th className="p-3 text-left">Workstation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400">
                          No assets found.
                        </td>
                      </tr>
                    ) : (
                      assets.map(asset => (
                        <tr 
                          key={asset.assetID} 
                          className={`border-t border-[#273C45] hover:bg-[#273C45] ${
                            asset.workStationID ? 'bg-[#1c3640]' : ''
                          }`}
                        >
                          <td className="p-3">
                            <input 
                              type="checkbox" 
                              checked={selectedAssets.includes(asset.assetID)}
                              onChange={() => handleAssetSelection(asset.assetID)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="p-3">{asset.assetName}</td>
                          <td className="p-3">{asset.categoryName}</td>
                          <td className="p-3">{asset.assetTag}</td>
                          <td className="p-3">
                            {asset.workStationID ? (
                              <span className="px-2 py-1 bg-[#41b853] bg-opacity-20 text-[#41b853] rounded-full text-xs">
                                {asset.workStationID}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-[#e63946] bg-opacity-20 text-[#e63946] rounded-full text-xs">
                                Unassigned
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Right panel - Workstation Selection */}
        <div>
          <div className="bg-[#16282F] rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Workstations</h2>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">
                Select Workstation
              </label>
              <select
                className="w-full bg-[#1c3640] border border-[#273C45] rounded p-3"
                value={selectedWorkstation}
                onChange={(e) => setSelectedWorkstation(e.target.value)}
              >
                <option value="">-- Select a workstation --</option>
                {workstations.map(ws => (
                  <option key={ws.workStationID} value={ws.workStationID}>
                    {ws.workStationID} - {ws.modelName}
                    {ws.empFirstName ? ` (${ws.empFirstName} ${ws.empLastName})` : ' (Unassigned)'}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedWorkstation && (
              <div className="bg-[#1c3640] p-3 rounded">
                <h3 className="font-semibold mb-2">Selected Workstation</h3>
                <p>
                  <span className="text-gray-400">ID:</span> {selectedWorkstation}
                </p>
                {workstations.find(ws => ws.workStationID === selectedWorkstation)?.empFirstName && (
                  <p className="mt-2">
                    <span className="text-gray-400">Employee:</span> {
                      `${workstations.find(ws => ws.workStationID === selectedWorkstation)?.empFirstName} 
                      ${workstations.find(ws => ws.workStationID === selectedWorkstation)?.empLastName}`
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAssetModal;