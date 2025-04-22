// src/components/WorkstationModal.jsx
import React from 'react';

const WorkstationModal = ({ isOpen, onClose, workstationId, workstationData, loading }) => {
  if (!isOpen) return null;

  // Helper function to get status text
  const getStatusText = () => {
    if (!workstationData) return 'Unassigned';
    
    if (workstationData.empID) {
      return workstationData.assetCount > 0 ? 'Complete' : 'Incomplete';
    } else {
      return workstationData.assetCount > 0 ? 'IT Equipment' : 'Unassigned';
    }
  };

  // Helper function to get status color class
  const getStatusColorClass = () => {
    if (!workstationData) return 'bg-[#e63946]'; // Red for unassigned
    
    if (workstationData.empID) {
      return workstationData.assetCount > 0 ? 'bg-[#41b853]' : 'bg-[#ff9f1c]';
    } else {
      return workstationData.assetCount > 0 ? 'bg-[#00b4d8]' : 'bg-[#e63946]';
    }
  };

  return (
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
            </div>
            
            {/* Assets */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Assigned Assets</h3>
              {workstationData.assets && workstationData.assets.length > 0 ? (
                <div className="space-y-3">
                  {workstationData.assets.map((asset, index) => (
                    <div key={index} className="bg-[#1c3640] p-4 rounded-lg">
                      <div className="flex justify-between border-b border-[#273C45] pb-2 mb-2">
                        <span className="font-medium">{asset.assetName}</span>
                        <span className="text-sm text-gray-400">{asset.assetID}</span>
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
              <button className="bg-[#1c3640] text-white px-4 py-2 rounded hover:bg-[#273C45]">
                Assign Assets
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
              className="bg-[#41b853] text-white px-4 py-2 rounded mt-4 hover:bg-[#36a046]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkstationModal;