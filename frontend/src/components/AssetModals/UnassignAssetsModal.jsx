import React, { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import axios from '../../api';

const UnassignAssetsModal = ({ isOpen, onClose, assetIds, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle unassign assets
  const handleUnassignAssets = async () => {
    setLoading(true);
    try {
      // Call the unassign API endpoint
      const response = await axios.post('/api/assets/unassign', {
        assetIds: assetIds
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
    } catch (err) {
      console.error('Error unassigning assets:', err);
      setError(err.response?.data?.error || 'Failed to unassign assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#16282F] rounded-lg max-w-md w-full overflow-hidden flex flex-col text-white">
        <div className="flex justify-between items-center p-6 border-b border-[#273C45]">
          <h2 className="text-xl font-semibold">Unassign Assets</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <p className="text-white mb-2">Are you sure you want to unassign the following assets?</p>
            <p className="text-gray-400 mb-4">This will return {assetIds.length} asset(s) to the inventory pool and remove them from the current workstation.</p>
          </div>
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-100 p-3 rounded mb-4 flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
          
          <p className="text-yellow-300 text-sm">
            <FaExclamationTriangle className="inline-block mr-2" />
            This action cannot be undone. The assets will need to be reassigned if needed.
          </p>
        </div>
        
        <div className="p-4 border-t border-[#273C45] flex justify-end">
          <button 
            onClick={onClose}
            className="bg-[#13232c] text-white px-4 py-2 rounded-md border border-[#273C45] mr-2"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            onClick={handleUnassignAssets}
            disabled={loading}
          >
            {loading ? 'Unassigning...' : 'Unassign Assets'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnassignAssetsModal;