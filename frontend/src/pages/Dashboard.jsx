// Frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import AccountModal from '../components/modal/AccountCreation';
import escLogo from '../assets/allianceLogo.png';
import map15F from '../assets/ESC Mapping 15th.png';
import map20F from '../assets/ESC Mapping 20th.png';
import axios from 'axios';

function Dashboard() {
  const [currentFloor, setCurrentFloor] = useState('15F');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isWorkstationModalOpen, setIsWorkstationModalOpen] = useState(false);
  const [selectedWorkstation, setSelectedWorkstation] = useState(null);
  const [workstationData, setWorkstationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workstations, setWorkstations] = useState([]);

  // Set up SVG interactions to make workstations clickable
  useEffect(() => {
    // Fetch workstation data
    const fetchWorkstations = async () => {
      try {
        // Use this when your API is ready
        // const response = await axios.get('/api/workstations');
        // setWorkstations(response.data);
        
        // For now, use mock data to test all status cases
        const mockData = [
          { workStationID: 'WSM001', empID: 1, assetCount: 3 },       // Complete (green)
          { workStationID: 'WSM002', empID: null, assetCount: 0 },    // Unassigned (red)
          { workStationID: 'WSM003', empID: null, assetCount: 2 },    // IT Equipment (blue)
          { workStationID: 'WSM004', empID: 1, assetCount: 0 },       // Incomplete (orange)
          { workStationID: 'WSM005', empID: 2, assetCount: 5 },       // Complete (green)
          { workStationID: 'WSM006', empID: null, assetCount: 3 },    // IT Equipment (blue)
          { workStationID: 'WSM007', empID: 3, assetCount: 0 }        // Incomplete (orange)
        ];
        setWorkstations(mockData);
      } catch (error) {
        console.error('Error loading workstations:', error);
      }
    };
    
    fetchWorkstations();
    
    // Function to set up interactions for workstations
    const setupWorkstationInteractions = (svgDoc) => {
      // Colors for different statuses
      const colors = {
        unassigned: '#e63946', // Red
        incomplete: '#ff9f1c',  // Orange
        complete: '#41b853',    // Green
        it_equipment: '#00b4d8' // Blue
      };

      // Select all workstation elements in the SVG
      const workstationElements = svgDoc.querySelectorAll('.workstation, .WorkStation, rect');
      
      console.log(`Found ${workstationElements.length} potential workstation elements`);
      
      // Add color and interactions to each workstation
      workstationElements.forEach(element => {
        // Get workstation ID - try data-cell-id first, then data-id
        const wsId = element.getAttribute('data-cell-id') || element.getAttribute('data-id') || 'Unknown';
        
        // Find this workstation in our data
        const wsData = workstations.find(ws => ws.workStationID === wsId);
        
        // Determine color based on status
        let color = colors.unassigned; // Default: red (unassigned)
        let status = 'unassigned';
        
        if (wsData) {
          if (wsData.empID) {
            if (wsData.assetCount > 0) {
              status = 'complete';
              color = colors.complete;
            } else {
              status = 'incomplete';
              color = colors.incomplete;
            }
          } else if (wsData.assetCount > 0) {
            status = 'it_equipment';
            color = colors.it_equipment;
          }
        }
        
        // Apply the color to the workstation (both attribute and style property)
        console.log(`Setting workstation ${wsId} to status ${status} with color ${color}`);
        element.setAttribute('fill', color);
        element.style.fill = color; // Override any inline style
        element.setAttribute('data-status', status);
        
        // Add click event
        element.addEventListener('click', function(event) {
          // Prevent event bubbling to avoid interfering with pan/zoom
          event.stopPropagation();
          
          showWorkstationDetails(wsId);
        });
        
        // Add hover effects
        element.addEventListener('mouseenter', function() {
          // Store original values
          this.setAttribute('original-fill', this.getAttribute('fill') || '');
          this.setAttribute('original-style-fill', this.style.fill);
          
          // Apply hover style
          this.style.stroke = '#ffffff';
          this.style.strokeWidth = '2';
          this.style.cursor = 'pointer';
          this.setAttribute('fill', '#3498db');
          this.style.fill = '#3498db'; // Set the style.fill as well
        });
        
        element.addEventListener('mouseleave', function() {
          // Reset to original style
          this.style.stroke = '#ffffff';
          this.style.strokeWidth = '1';
          this.setAttribute('fill', this.getAttribute('original-fill') || '');
          this.style.fill = this.getAttribute('original-style-fill');
        });
      });
    };
    
    // Show workstation details
    const showWorkstationDetails = (workstationId) => {
      setSelectedWorkstation(workstationId);
      setLoading(true);
      
      // Find the workstation in our data
      const wsData = workstations.find(ws => ws.workStationID === workstationId);
      
      // Mock API call - replace with actual API call
      setTimeout(() => {
        // Mock data for demo purposes
        const mockData = {
          workstation_id: workstationId,
          status: wsData && wsData.empID ? 'Occupied' : 'Unassigned',
          employee_name: 'John Doe',
          position: 'Software Developer',
          assets: [
            {
              name: 'Monitor 1',
              asset_id: 'MANILA-MON-001',
              category: 'Monitor',
              model: 'Dell P2419H',
              manufacturer: 'Dell',
              serial_number: 'CN12345678'
            },
            {
              name: 'Monitor 2',
              asset_id: 'MANILA-MON-002',
              category: 'Monitor',
              model: 'Dell P2419H',
              manufacturer: 'Dell',
              serial_number: 'CN87654321'
            },
            {
              name: 'System Unit',
              asset_id: 'MANILA-PC-001',
              category: 'Computer',
              model: 'OptiPlex 7080',
              manufacturer: 'Dell',
              serial_number: 'PCXYZ123456'
            },
            {
              name: 'Keyboard',
              asset_id: 'MANILA-KB-001',
              category: 'Keyboard',
              model: 'KB216',
              manufacturer: 'Dell'
            }
          ]
        };
        
        // If we have wsData, adjust the assets array to match the assetCount
        if (wsData) {
          if (wsData.assetCount === 0) {
            mockData.assets = [];
          } else if (wsData.assetCount < mockData.assets.length) {
            mockData.assets = mockData.assets.slice(0, wsData.assetCount);
          }
        }
        
        setWorkstationData(mockData);
        setLoading(false);
        setIsWorkstationModalOpen(true);
      }, 500);
    };
    
    // Setup pan and zoom functionality
    const setupPanZoom = (svgDoc) => {
      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement) return;
      
      let isDragging = false;
      let startX, startY;
      let currentX = 0, currentY = 0;
      let scale = 1;
      
      // Enable dragging (panning)
      svgElement.addEventListener('mousedown', function(e) {
        // Skip if we're clicking on a workstation
        if (e.target.classList.contains('workstation') || 
            e.target.classList.contains('WorkStation') ||
            e.target.tagName.toLowerCase() === 'rect') {
          return;
        }
        
        isDragging = true;
        startX = e.clientX - currentX;
        startY = e.clientY - currentY;
        svgElement.style.cursor = 'grabbing';
      });
      
      svgDoc.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        
        svgElement.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
      });
      
      svgDoc.addEventListener('mouseup', function() {
        isDragging = false;
        svgElement.style.cursor = 'grab';
      });
      
      // Enable zooming with mouse wheel
      svgElement.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.max(0.5, Math.min(3, scale + delta));
        
        // Update transform with the new scale
        svgElement.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
      });
      
      // Initial cursor style
      svgElement.style.cursor = 'grab';
    };
    
    // Function to setup the SVG when it loads
    const setupSvg = () => {
      const svgObject = document.getElementById('floorPlanSVG');
      if (!svgObject) {
        console.error('SVG object not found!');
        return;
      }
      
      const handleLoad = () => {
        if (svgObject.contentDocument) {
          console.log('SVG loaded, setting up interactions...');
          setupWorkstationInteractions(svgObject.contentDocument);
          setupPanZoom(svgObject.contentDocument);
        } else {
          console.error('SVG content document is null!');
        }
      };
      
      if (svgObject.contentDocument && svgObject.contentDocument.querySelector('svg')) {
        handleLoad();
      } else {
        console.log('SVG content document not ready, adding load listener...');
        svgObject.addEventListener('load', handleLoad);
      }
    };
    
    // Initial setup with a small delay to ensure DOM is ready
    setTimeout(setupSvg, 500);
    
    // Cleanup function
    return () => {
      // Cleanup code if needed
    };
  }, [currentFloor, workstations]); // Re-run when floor or workstation data changes

  return (
    <div className="w-full h-full text-[0.94rem]">
      <div className="min-h-screen h-dvh w-full max-w-[2200px] mx-auto flex bg-[#132025] text-white font-sans overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-54 min-h-screen max-h-screen flex-shrink-0 bg-[#16282F] p-4 flex flex-col flex">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-[#1e4975] w-12 h-12 rounded flex items-center justify-center">
            <img src={escLogo} alt="ESC Logo" className="h-10 w-10" />
          </div>
          <div className="text-[#41b853]">
            <h1 className="text-2xl font-bold leading-none">Esc</h1>
            <span className="text-xs tracking-wider uppercase">CORPORATION</span>
          </div>
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
              <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer">
                <span className="text-gray-400">🏭</span>
                <span>Manufacturers</span>
              </div>
              <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer">
                <span className="text-gray-400">🏷️</span>
                <span>Categories</span>
              </div>
              <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer">
                <span className="text-gray-400">💻</span>
                <span>Models</span>
              </div>
              <div className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer">
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto" > 
        <div className="flex flex-col items-center justify-center gap-4 h-full" >
          {/* Floor plan container */}
          <div className="bg-[#16282F] w-full p-4 rounded-lg grid items-center justify-center" > 
            <div className="flex items-start justify-center w-full" >
              {/* Container for the Map */}
              <div className="relative bg-[#0C181C] border-6 border-[#16282F] rounded-lg overflow-hidden w-[1290] h-[905px]">
                <div className="relative p-4 flex items-center justify-center mx-auto my-0" style={{ height: '405px', flex: '0 0 auto', position: 'relative' }}>
                  <div className="w-[1290] h-[405px] relative grid items-center justifsy-center">
                    {/* SVG Floor Plan */}
                    <object 
                      id="floorPlanSVG" 
                      data={`/svg/ASCL_FloorPlan${currentFloor === '20F' ? '_20F' : ''}.svg`}
                      type="image/svg+xml" 
                      width="100%" 
                      height="100%" 
                    />
                  </div>
                </div>
              </div>

              {/* Separate Container for Floor Buttons */}
              <div className="flex flex-col items-start justify-start ml-4">
                <div className="text-2xl font-bold text-[#41b853]">{currentFloor}</div>
                {/* Floor switcher buttons */}
                <div className="mt-2 space-y-2">

                </div>
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

      {/* Account Creation Modal */}
      {isAccountModalOpen && (
        <AccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} />
      )}

      {/* Workstation Modal */}
      {isWorkstationModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-[#16282F] text-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#273C45] pb-4 mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <span>{selectedWorkstation}</span>
                {workstationData && (
                  <span className={`ml-3 text-sm px-2 py-1 rounded ${
                    workstationData.status === 'Occupied' ? 'bg-[#41b853]' : 'bg-[#e63946]'
                  }`}>
                    {workstationData.status}
                  </span>
                )}
              </h2>
              <button 
                onClick={() => setIsWorkstationModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
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
                      <span className="ml-2">{workstationData.employee_name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Position:</span>
                      <span className="ml-2">{workstationData.position || 'N/A'}</span>
                    </div>
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
                            <span className="font-medium">{asset.name}</span>
                            <span className="text-sm text-gray-400">{asset.asset_id}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
                    <div className="bg-[#1c3640] p-4 rounded-lg text-center">
                      <p className="text-gray-400">No assets assigned to this workstation.</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end mt-6 space-x-3">
                  <button className="bg-[#1c3640] text-white px-4 py-2 rounded">
                    Edit
                  </button>
                  <button className="bg-[#1c3640] text-white px-4 py-2 rounded">
                    Transfer
                  </button>
                  <button 
                    onClick={() => setIsWorkstationModalOpen(false)}
                    className="bg-[#41b853] text-white px-4 py-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No data available for this workstation.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;