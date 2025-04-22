import React, { useState, useEffect } from 'react';

const WorkstationModal = ({ isOpen, onClose, workstationId }) => {
  const [workstationData, setWorkstationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('details'); // 'details', 'edit', or 'transfer'
  const [transferDestination, setTransferDestination] = useState('');
  const [availableWorkstations, setAvailableWorkstations] = useState([]);

  // Fetch workstation data
  useEffect(() => {
    if (!isOpen || !workstationId) return;

    const fetchWorkstationData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/esc/workstation/${workstationId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workstation data');
        }
        const data = await response.json();
        setWorkstationData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching workstation details:', err);
        setError('Failed to load workstation details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkstationData();
  }, [isOpen, workstationId]);

  // Fetch available workstations for transfer
  useEffect(() => {
    if (view !== 'transfer' || !workstationId) return;

    const fetchAvailableWorkstations = async () => {
      try {
        const response = await fetch('/api/esc/workstations');
        if (!response.ok) {
          throw new Error('Failed to fetch workstations');
        }
        const data = await response.json();
        // Filter out current workstation and occupied ones
        const available = data.filter(ws => 
          ws.workstation_id !== workstationId && ws.status !== 'Occupied'
        );
        setAvailableWorkstations(available);
      } catch (err) {
        console.error('Error fetching workstations for transfer:', err);
      }
    };

    fetchAvailableWorkstations();
  }, [view, workstationId]);

  // Handle form submission for editing workstation
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    
    // Process assets separately
    const assets = [];
    
    // Convert FormData to JSON
    for (const [key, value] of formData.entries()) {
      if (key.includes('assets[')) {
        // Parse asset data
        const matches = key.match(/assets\[(\d+)\]\[([^\]]+)\]/);
        if (matches) {
          const [, index, field] = matches;
          if (!assets[index]) assets[index] = {};
          assets[index][field] = value;
        }
      } else {
        data[key] = value;
      }
    }
    
    // Add assets to data
    data.assets = assets;
    
    try {
      const response = await fetch(`/api/esc/workstation/${workstationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Include CSRF token if needed
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update workstation');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh data and go back to details view
        setWorkstationData(prev => ({ ...prev, ...data }));
        setView('details');
      } else {
        setError(result.message || 'Failed to update workstation');
      }
    } catch (err) {
      console.error('Error updating workstation:', err);
      setError('Failed to update workstation. Please try again.');
    }
  };

  // Handle workstation transfer
  const handleTransfer = async () => {
    if (!transferDestination) {
      setError('Please select a destination workstation.');
      return;
    }
    
    try {
      const response = await fetch('/api/esc/workstation/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify({
          source_id: workstationId,
          destination_id: transferDestination
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to transfer workstation');
      }
      
      const result = await response.json();
      
      if (result.success) {
        onClose(); // Close the modal
        // You might want to trigger a refresh of the floor plan here
      } else {
        setError(result.message || 'Failed to transfer workstation');
      }
    } catch (err) {
      console.error('Error transferring workstation:', err);
      setError('Failed to transfer workstation. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#16282F] text-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-[#273C45] p-4">
          <h2 className="text-xl font-bold">
            {workstationId} - {loading ? 'Loading...' : (workstationData?.status || 'Unknown')}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#41b853]"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4">{error}</div>
          ) : (
            <>
              {/* View Selector Buttons */}
              <div className="flex space-x-2 mb-4">
                <button 
                  onClick={() => setView('details')}
                  className={`px-4 py-2 rounded ${view === 'details' ? 'bg-[#41b853] text-white' : 'bg-[#1c3640] text-gray-300'}`}
                >
                  Details
                </button>
                <button 
                  onClick={() => setView('edit')}
                  className={`px-4 py-2 rounded ${view === 'edit' ? 'bg-[#41b853] text-white' : 'bg-[#1c3640] text-gray-300'}`}
                >
                  Edit
                </button>
                <button 
                  onClick={() => setView('transfer')}
                  className={`px-4 py-2 rounded ${view === 'transfer' ? 'bg-[#41b853] text-white' : 'bg-[#1c3640] text-gray-300'}`}
                >
                  Transfer
                </button>
              </div>

              {/* Details View */}
              {view === 'details' && workstationData && (
                <div className="workstation-details">
                  <div className="bg-[#1c3640] p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold mb-2">Employee Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Employee:</span>
                        <span className="ml-2">{workstationData.employee_name || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Position:</span>
                        <span className="ml-2">{workstationData.position || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assets Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Assigned Assets</h3>
                    {workstationData.assets && workstationData.assets.length > 0 ? (
                      <div className="space-y-3">
                        {workstationData.assets.map((asset, index) => (
                          <div key={index} className="bg-[#1c3640] p-4 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">{asset.name}</span>
                              <span className="text-sm text-gray-400">{asset.asset_id}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-400">Category:</span>
                                <span className="ml-2">{asset.category || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Model:</span>
                                <span className="ml-2">{asset.model || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Manufacturer:</span>
                                <span className="ml-2">{asset.manufacturer || 'N/A'}</span>
                              </div>
                              {asset.serial_number && (
                                <div>
                                  <span className="text-gray-400">Serial Number:</span>
                                  <span className="ml-2">{asset.serial_number}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#1c3640] p-4 rounded-lg text-center text-gray-400">
                        No assets assigned to this workstation.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Edit View */}
              {view === 'edit' && workstationData && (
                <form onSubmit={handleEditSubmit} id="workstationEditForm">
                  <input type="hidden" name="workstation_id" value={workstationId} />
                  
                  <div className="bg-[#1c3640] p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold mb-3">Employee Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-1">Employee Name</label>
                        <input 
                          type="text" 
                          name="employee_name" 
                          defaultValue={workstationData.employee_name || ''} 
                          className="w-full bg-[#273C45] text-white p-2 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Position</label>
                        <input 
                          type="text" 
                          name="position" 
                          defaultValue={workstationData.position || ''} 
                          className="w-full bg-[#273C45] text-white p-2 rounded"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Assets Form */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Assets</h3>
                    <div className="space-y-4" id="assets-container">
                      {/* Define standard assets that should be present */}
                      {[
                        { type: 'Monitor 1', prefix: 'MANILA-MON', show_serial: true },
                        { type: 'Monitor 2', prefix: 'MANILA-MON', show_serial: true },
                        { type: 'System Unit', prefix: 'MANILA-PC', show_serial: true },
                        { type: 'Mouse', prefix: 'MANILA-MSE', show_serial: false },
                        { type: 'Keyboard', prefix: 'MANILA-KB', show_serial: false },
                        { type: 'Headset', prefix: 'MANILA-HS', show_serial: false },
                        { type: 'Webcam', prefix: 'MANILA-WB', show_serial: false },
                        { type: 'Telephone', prefix: 'MANILA-TEL', show_serial: false }
                      ].map((standardAsset, index) => {
                        // Find if there's an existing asset of this type
                        const existingAsset = workstationData.assets ? 
                          workstationData.assets.find(a => a.name === standardAsset.type) : null;
                        
                        return (
                          <div key={index} className="bg-[#1c3640] p-4 rounded-lg">
                            <h4 className="font-medium mb-3">{standardAsset.type}</h4>
                            <input type="hidden" name={`assets[${index}][type]`} value={standardAsset.type} />
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-gray-400 mb-1">Asset Tag</label>
                                <input 
                                  type="text" 
                                  name={`assets[${index}][asset_id]`}
                                  defaultValue={existingAsset ? existingAsset.asset_id : `${standardAsset.prefix}-???`}
                                  className="w-full bg-[#273C45] text-white p-2 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 mb-1">Category</label>
                                <input 
                                  type="text" 
                                  name={`assets[${index}][category]`}
                                  defaultValue={
                                    existingAsset && existingAsset.category 
                                      ? existingAsset.category 
                                      : standardAsset.type
                                  }
                                  className="w-full bg-[#273C45] text-white p-2 rounded"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-gray-400 mb-1">Manufacturer</label>
                                <input 
                                  type="text" 
                                  name={`assets[${index}][manufacturer]`}
                                  defaultValue={existingAsset ? existingAsset.manufacturer || '' : ''}
                                  className="w-full bg-[#273C45] text-white p-2 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 mb-1">Model</label>
                                <input 
                                  type="text" 
                                  name={`assets[${index}][model]`}
                                  defaultValue={existingAsset ? existingAsset.model || '' : ''}
                                  className="w-full bg-[#273C45] text-white p-2 rounded"
                                />
                              </div>
                            </div>
                            
                            {standardAsset.show_serial && (
                              <div>
                                <label className="block text-gray-400 mb-1">Serial Number</label>
                                <input 
                                  type="text" 
                                  name={`assets[${index}][serial_number]`}
                                  defaultValue={
                                    existingAsset && existingAsset.serial_number 
                                      ? existingAsset.serial_number 
                                      : ''
                                  }
                                  className="w-full bg-[#273C45] text-white p-2 rounded"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => setView('details')}
                      className="bg-[#273C45] text-white px-4 py-2 rounded mr-2"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-[#41b853] text-white px-4 py-2 rounded"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Transfer View */}
              {view === 'transfer' && (
                <div>
                  <div className="bg-[#1c3640] p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold mb-3">Transfer Workstation</h3>
                    <p className="mb-4 text-gray-300">
                      Transfer all assets and employee information from {workstationId} to another workstation.
                    </p>
                    
                    <div className="mb-4">
                      <label className="block text-gray-400 mb-1">Destination Workstation</label>
                      <select 
                        id="transferDestination"
                        value={transferDestination}
                        onChange={(e) => setTransferDestination(e.target.value)}
                        className="w-full bg-[#273C45] text-white p-2 rounded"
                      >
                        <option value="">-- Select Workstation --</option>
                        {availableWorkstations.map(ws => (
                          <option 
                            key={ws.workstation_id} 
                            value={ws.workstation_id}
                            disabled={ws.status === 'Occupied'}
                          >
                            {ws.workstation_id} - {ws.status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => setView('details')}
                      className="bg-[#273C45] text-white px-4 py-2 rounded mr-2"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleTransfer}
                      className="bg-[#41b853] text-white px-4 py-2 rounded"
                    >
                      Confirm Transfer
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkstationModal;