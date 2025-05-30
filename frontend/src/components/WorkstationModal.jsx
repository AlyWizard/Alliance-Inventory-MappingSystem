import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignEmployeeModal from './AssignEmployeeModal';
import ManageAssetsModal from './ManageAssetsModal';

const WorkstationModal = ({ isOpen, onClose, workstationId }) => {
  const [loading, setLoading] = useState(true);
  const [workstationData, setWorkstationData] = useState(null);
  const [error, setError] = useState(null);
  const [isAssignEmployeeModalOpen, setIsAssignEmployeeModalOpen] = useState(false);
  const [isManageAssetsModalOpen, setIsManageAssetsModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && workstationId) {
      fetchWorkstationData();
    }
  }, [isOpen, workstationId]);

  const fetchWorkstationData = async () => {
    setLoading(true);
    try {
      // Fetch workstation details
      const response = await axios.get(`/api/workstations/${workstationId}`);
      
      // Fetch assets assigned to this workstation
      const assetsResponse = await axios.get(`/api/workstations/${workstationId}/assets`);
      
      // Combine the data
      const combinedData = {
        ...response.data,
        assets: assetsResponse.data
      };
      //Hello world
      setWorkstationData(combinedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching workstation data:", err);
      setError("Failed to load workstation data. Please try again.");
      
      // For demo purposes - use mock data if API fails
      setWorkstationData({
        workStationID: workstationId,
        modelName: `Workstation ${workstationId}`,
        empID: workstationId === 'WSM001' ? 1 : null,
        empFirstName: workstationId === 'WSM001' ? 'John' : null,
        empLastName: workstationId === 'WSM001' ? 'Doe' : null,
        empDept: workstationId === 'WSM001' ? 'IT Department' : null,
        assetCount: workstationId === 'WSM001' ? 3 : 0,
        assets: workstationId === 'WSM001' ? [
          { assetID: 1, assetName: 'Dell Monitor', categoryName: 'Monitor', assetTag: 'MON-001' },
          { assetID: 2, assetName: 'HP Laptop', categoryName: 'Computer', assetTag: 'LAP-001' },
          { assetID: 3, assetName: 'Logitech Keyboard', categoryName: 'Peripheral', assetTag: 'KEY-001' }
        ] : []
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle employee assignment completion
  const handleEmployeeAssigned = (updatedWorkstation) => {
    // Refresh workstation data
    fetchWorkstationData();
    setIsAssignEmployeeModalOpen(false);
  };

  // Handle asset management completion
  const handleAssetsUpdated = () => {
    // Refresh workstation data
    fetchWorkstationData();
    setIsManageAssetsModalOpen(false);
  };

  // Helper function to get status text
  const getStatusText = () => {
    if (!workstationData) return 'Unknown';
    
    // Server or BoardRoom
    if (workstationId.startsWith('SVR') || workstationId.startsWith('BR')) {
      return 'IT Equipment';
    }
    
    if (workstationData.empID && workstationData.assetCount > 0) {
      return 'Complete';
    } else if (workstationData.empID || workstationData.assetCount > 0) {
      return 'Incomplete';
    } else {
      return 'Unassigned';
    }
  };

  // Helper function to get status color class
  const getStatusColorClass = () => {
    // Server or BoardRoom
    if (workstationId.startsWith('SVR') || workstationId.startsWith('BR')) {
      return 'bg-[#00b4d8]'; // Blue for IT Equipment
    }
    
    if (!workstationData) return 'bg-gray-500';
    
    if (workstationData.empID && workstationData.assetCount > 0) {
      return 'bg-[#41b853]'; // Green for Complete
    } else if (workstationData.empID) {
      return 'bg-[#ff9f1c]'; // Orange for Incomplete with employee
    } else if (workstationData.assetCount > 0) {
      return 'bg-[#ff9f1c]'; // Orange for Incomplete with assets
    } else {
      return 'bg-[#e63946]'; // Red for Unassigned
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-[#16282F] text-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b border-[#273C45] pb-4 mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <span>Workstation: {workstationId}</span>
              {!loading && workstationData && (
                <span className={`ml-3 text-sm px-2 py-1 rounded ${getStatusColorClass()}`}>
                  {getStatusText()}
                </span>
              )}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
          
          {/* Modal Content */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-t-2 border-b-2 border-[#41b853] rounded-full animate-spin"></div>
              <p className="mt-2">Loading workstation data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              <p>{error}</p>
              <button 
                onClick={onClose}
                className="mt-4 bg-[#41b853] text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          ) : workstationData ? (
            <div>
              {/* Employee Information */}
              <div className="bg-[#1c3640] p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold mb-2">Employee Information</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <span className="text-gray-400">Employee:</span>
                    <span className="ml-2">
                      {workstationData.empFirstName && workstationData.empLastName 
                        ? `${workstationData.empFirstName} ${workstationData.empLastName}` 
                        : 'Unassigned'}
                    </span>
                  </div>
                  {workstationData.empDept && (
                    <div>
                      <span className="text-gray-400">Department:</span>
                      <span className="ml-2">{workstationData.empDept}</span>
                    </div>
                  )}
                </div>
                {!workstationData.empID && !workstationId.startsWith('SVR') && !workstationId.startsWith('BR') && (
                  <button 
                    className="mt-4 bg-[#38b6ff] text-white px-3 py-1 rounded text-sm"
                    onClick={() => setIsAssignEmployeeModalOpen(true)}
                  >
                    Assign Employee
                  </button>
                )}
              </div>
              
              {/* Assets */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Assigned Assets</h3>
                  <button 
                    className="bg-[#38b6ff] text-white px-3 py-1 rounded text-sm"
                    onClick={() => setIsManageAssetsModalOpen(true)}
                  >
                    Manage Assets
                  </button>
                </div>
                
                {workstationData.assets && workstationData.assets.length > 0 ? (
                  <div className="space-y-3">
                    {workstationData.assets.map((asset, index) => (
                      <div key={index} className="bg-[#1c3640] p-4 rounded-lg">
                        <div className="flex justify-between border-b border-[#273C45] pb-2 mb-2">
                          <span className="font-medium">{asset.assetName}</span>
                          <span className="text-sm text-gray-400">{asset.assetTag}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-400">Category:</span>
                            <span className="ml-2">{asset.categoryName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Serial No:</span>
                            <span className="ml-2">{asset.serialNo || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1c3640] p-4 rounded-lg text-center">
                    <p className="text-gray-400">No assets assigned to this workstation.</p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end mt-6 space-x-3">
                <button className="bg-[#1c3640] text-white px-4 py-2 rounded hover:bg-[#273C45]">
                  Edit
                </button>
                <button 
                  onClick={onClose}
                  className="bg-[#41b853] text-white px-4 py-2 rounded hover:bg-[#36a046]"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No data available for this workstation.</p>
              <button 
                onClick={onClose}
                className="mt-4 bg-[#41b853] text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Assign Employee Modal */}
      <AssignEmployeeModal 
        isOpen={isAssignEmployeeModalOpen}
        onClose={() => setIsAssignEmployeeModalOpen(false)}
        workstationId={workstationId}
        onAssign={handleEmployeeAssigned}
      />
      
      {/* Manage Assets Modal */}
      <ManageAssetsModal 
        isOpen={isManageAssetsModalOpen}
        onClose={() => setIsManageAssetsModalOpen(false)}
        workstationId={workstationId}
        workstationData={workstationData}
        onUpdate={handleAssetsUpdated}
      />
    </>
  );
};

export default WorkstationModal;