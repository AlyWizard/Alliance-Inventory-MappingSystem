import React, { useState, useEffect } from 'react';
import FloorMap from '../components/FloorMap';  // Use original component name
import WorkstationAssignModal from '../components/WorkstationAssignModal';
import escLogo from '../assets/allianceLogo.png';

function Dashboard() {
  const [isWorkstationModalOpen, setIsWorkstationModalOpen] = useState(false);
  const [selectedWorkstation, setSelectedWorkstation] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [forceMapUpdate, setForceMapUpdate] = useState(0); // Add state to force FloorMap to update

  // Listen for custom events from FloorMap component
  useEffect(() => {
    const handleShowWorkstationModal = (event) => {
      console.log("Event triggered with workstation:", event.detail.workstationId);
      setSelectedWorkstation(event.detail.workstationId);
      setIsWorkstationModalOpen(true);
    };

    // Listen for workstation update events
    const handleWorkstationUpdate = (event) => {
      console.log("Workstation updated:", event.detail);
      // Force FloorMap to re-render by updating its key
      setForceMapUpdate(prev => prev + 1);
    };

    // Add event listeners
    window.addEventListener('showWorkstationModal', handleShowWorkstationModal);
    window.addEventListener('workstationUpdated', handleWorkstationUpdate);

    return () => {
      // Remove event listeners on cleanup
      window.removeEventListener('showWorkstationModal', handleShowWorkstationModal);
      window.removeEventListener('workstationUpdated', handleWorkstationUpdate);
    };
  }, []);

  // Handle modal close
  const handleCloseModal = () => {
    setIsWorkstationModalOpen(false);
    
    // Force FloorMap to update when modal closes to refresh workstation colors
    setTimeout(() => {
      setForceMapUpdate(prev => prev + 1);
      setSelectedWorkstation(null);
    }, 300); // Wait for animation to complete
  };

  return (
    <div className="w-full h-full text-[0.94rem]">
      <div className="min-h-screen h-dvh w-full max-w-[2200px] mx-auto flex bg-[#132025] text-white font-sans overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-54 min-h-screen max-h-screen flex-shrink-0 bg-[#16282F] p-4 flex flex-col flex">
          {/* Logo */}
          <div className="rounded flex items-center justify-center">
            <img src={escLogo} alt="ESC Logo" className="h-30 w-40"/>
          </div>

          {/* Mapping Section */}
          <div className="bg-[#1c3640] rounded-md p-3 mb-4" style={{ width: '220px', height: '190px' }}>
            <button className="bg-[#41b853] text-white px-4 py-2 w-full rounded mb-3 font-semibold">
                Floor Mapping
            </button>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#e63946] rounded"></div>
                <span>Unassigned</span>
                </div>
                <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#ff9f1c] rounded"></div>
                <span>Incomplete</span>
                </div>
                <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#41b853] rounded"></div>
                <span>Complete</span>
                </div>
                <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#00b4d8] rounded"></div>
                <span>I.T. Equipment</span>
                </div>
            </div>
          </div>

          {/* Inventories Section */}
          <div className="mb-4">
            <h2 className="text-lg mb-2">Inventories</h2>
            <div className="bg-[#1c3640] rounded-md p-3">
              <div className="space-y-2">
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

          {/* Others Section */}
          <div className="">
            <div className="flex space-x-2 mb-4">
              <div className="bg-[#1c3640] py-1 px-2 rounded flex-1 flex items-center justify-center flex-col">
                <span className="text-base mb-1 leading-none">📊</span>
                <span className="text-[0.65rem] leading-tight">Reports</span>
              </div>
              <div className="bg-[#1c3640] py-1 px-2 rounded flex-1 flex items-center justify-center flex-col">
                <span className="text-base mb-1 leading-none">💾</span>
                <span className="text-[0.65rem] leading-tight">Backup</span>
              </div>
            </div>
            
            {/* Divider between About/Logout and Assets */}
            <div className="h-1 bg-[#273C45] my-2"></div>

            <div className="bg-[#1c3640] py-1 px-2 rounded flex-1 flex items-center justify-center flex-col">
              <span className="text-base mb-1 leading-none">💾</span>
              <span className="text-[0.65rem] leading-tight">Backup</span>
            </div>
          
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="bg-[#162F20] text-white py-3 px-4 rounded-xl text-sm font-semibold w-full mt-4 border-4"
              style={{ borderColor: '#4D8D36' }}
            >
              Account Creation
            </button>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="bg-[#162F20] text-white py-3 px-4 rounded-xl text-sm font-semibold w-full mt-4 border-4"
              style={{ borderColor: '#4D8D36' }}
            >
              Logout
            </button>

          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-hidden"> 
          <div className="flex flex-col items-center justify-center h-full">
            {/* Floor plan container - optimized for larger display */}
            <div className="bg-[#16282F] w-full h-full rounded-lg p-2"> 
              {/* Container for the Map - Use key prop to force re-render */}
              <div className="w-full h-full flex items-center justify-center relative">
                {/* Use the new EnhancedFloorMap component */}
                <FloorMap key={forceMapUpdate} forceMapUpdate={forceMapUpdate} />
                
                {/* Floor Level Indicator - Positioned at top right */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="text-3xl font-bold text-[#41b853]">15F</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar Container */}
        <div className="h-full flex flex-col bg-[#16282F] p-2 rounded-lg border-l-4 border-[#16282F]">
          {/* Right Sidebar */}
          <aside className="w-54 h-full flex-shrink-0 bg-[#16282F] p-4 flex flex-col flex">
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-[#1c3640] rounded-2xl p-3 flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-6 rounded-full bg-[#273C45] flex items-center justify-center">
                  <span className="text-xs text-white">ℹ️</span>
                </div>
                <span className="text-sm">About</span>
              </div>
              <div className="flex-1 bg-[#1c3640] rounded-2xl p-3 flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-6 rounded-full bg-[#273C45] flex items-center justify-center">
                  <span className="text-xs text-white">🚪</span>
                </div>
                <span className="text-sm">Logout</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-4">Assets</h2>
            
            {/* Asset Status Buttons */}
            <div className="space-y-3 flex-1">
              <div className="h-16 bg-[#1c3640] rounded-2xl px-4 flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-6 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs">⚪</span>
                </div>
                <span className="font-medium">List All</span>
              </div>
              
              {/* Divider after List All */}
              <div className="h-1 bg-[#273C45] my-2"></div>

              <div className="h-16 bg-[#1c3640] rounded-2xl px-4 flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-6 rounded-full bg-[#41b853] flex items-center justify-center">
                  <span className="text-xs text-white">✓</span>
                </div>
                <span className="font-medium">Ready to Deploy</span>
              </div>

              <div className="h-16 bg-[#1c3640] rounded-2xl px-4 flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-6 rounded-full bg-[#00b4d8] flex items-center justify-center">
                  <span className="text-xs text-white">⌘</span>
                </div>
                <span className="font-medium">Onsite (Deployed)</span>
              </div>

              <div className="h-16 bg-[#1c3640] rounded-2xl px-4 flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-6 rounded-full bg-[#0096c7] flex items-center justify-center">
                  <span className="text-xs text-white">⌂</span>
                </div>
                <span className="font-medium">WFH (Deployed)</span>
              </div>

              <div className="h-16 bg-[#1c3640] rounded-2xl px-4 flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-6 rounded-full bg-[#ff48b0] flex items-center justify-center">
                  <span className="text-xs text-white">⏱</span>
                </div>
                <span className="font-medium">Temporarily Deployed</span>
              </div>

              <div className="h-16 bg-[#1c3640] rounded-2xl px-4 flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-6 rounded-full bg-[#ff5714] flex items-center justify-center">
                  <span className="text-xs text-white">⇄</span>
                </div>
                <span className="font-medium">Borrowed by ESC</span>
              </div>

              {/* Divider after Borrowed by ESC */}
              <div className="h-1 bg-[#273C45] my-2"></div>

              <div className="h-16 bg-[#1c3640] rounded-2xl px-4 flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-6 rounded-full bg-[#e63946] flex items-center justify-center">
                  <span className="text-xs text-white">✕</span>
                </div>
                <span className="font-medium">Defective</span>
              </div>

              {/* Divider after Defective */}
              <div className="h-1 bg-[#273C45] my-2"></div>
            </div>
            
            {/* Create New Button */}
            <button className="bg-[#41b853] text-white py-4 px-4 rounded-xl text-lg font-semibold mt-4">
              Create New
            </button>
          </aside>
        </div>
      </div>

      {/* Workstation Assignment Modal */}
      {selectedWorkstation && (
        <WorkstationAssignModal
          isOpen={isWorkstationModalOpen}
          onClose={handleCloseModal}
          workstationId={selectedWorkstation}
        />
      )}
    </div>
  );
}

export default Dashboard;