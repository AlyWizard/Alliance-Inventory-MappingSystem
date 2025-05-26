import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import WorkstationAssignModal from './WorkstationAssignModal';

const FloorMap = ({ forceMapUpdate }) => {
  const [workstations, setWorkstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const colorizeTimeoutRef = useRef(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkstationId, setSelectedWorkstationId] = useState(null);
  
  // Status colors
  const colors = {
    unassigned: '#e63946', // Red
    incomplete: '#ff9f1c',  // Orange
    complete: '#41b853',    // Green
    it_equipment: '#00b4d8' // Blue
  };

  // Fetch workstations data
  const fetchWorkstations = async () => {
    try {
      setLoading(true);
      
      // Call your API to get workstation data
      const response = await axios.get('/api/workstations');
      console.log('Fetched workstations:', response.data);
      setWorkstations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading workstations:', err);
      setError('Failed to load workstation data');
      setWorkstations([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchWorkstations();
  }, [forceMapUpdate]);

  // Listen for workstation updates
  useEffect(() => {
    const handleWorkstationUpdate = (e) => {
      console.log("Workstation updated - refreshing data", e.detail);
      fetchWorkstations();
      
      // Add a slight delay to ensure the SVG is recolored after data refresh
      if (colorizeTimeoutRef.current) {
        clearTimeout(colorizeTimeoutRef.current);
      }
      
      colorizeTimeoutRef.current = setTimeout(() => {
        colorizeSvg();
      }, 500);
    };

    // Add event listener
    window.addEventListener('workstationUpdated', handleWorkstationUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('workstationUpdated', handleWorkstationUpdate);
      if (colorizeTimeoutRef.current) {
        clearTimeout(colorizeTimeoutRef.current);
      }
    };
  }, []);

  // Listen for modal triggers
  useEffect(() => {
    const handleShowModal = (e) => {
      console.log("Show modal event received:", e.detail);
      setSelectedWorkstationId(e.detail.workstationId);
      setShowModal(true);
    };

    window.addEventListener('showWorkstationModal', handleShowModal);

    // Cleanup
    return () => {
      window.removeEventListener('showWorkstationModal', handleShowModal);
    };
  }, []);

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setSelectedWorkstationId(null);
    
    // Ensure SVG is recolored when modal closes
    setTimeout(() => {
      colorizeSvg();
    }, 100);
  };

  // Add zoom functionality
  const handleWheel = (e) => {
    e.preventDefault();
    
    // Temporarily disable pointer events on SVG during zooming
    const svgObj = document.getElementById('floorPlanSVG');
    if (svgObj && svgObj.contentDocument) {
      const svgRoot = svgObj.contentDocument.querySelector('svg');
      if (svgRoot) {
        svgRoot.style.pointerEvents = 'none';
        
        // Re-enable pointer events after zoom animation completes
        clearTimeout(window.zoomTimeout);
        window.zoomTimeout = setTimeout(() => {
          svgRoot.style.pointerEvents = 'auto';
        }, 300); // Time slightly longer than the transition duration
      }
    }
    
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.5), 5); // Limit scale between 0.5 and 5
    setScale(newScale);
  };

  // Start dragging - only with right mouse button
  const handleMouseDown = (e) => {
    // Only initiate drag if using right mouse button (button 2)
    if (e.button !== 2) {
      return;
    }
    
    // Prevent context menu
    e.preventDefault();
    
    // Temporarily disable pointer events on SVG when dragging starts
    const svgObj = document.getElementById('floorPlanSVG');
    if (svgObj && svgObj.contentDocument) {
      const svgRoot = svgObj.contentDocument.querySelector('svg');
      if (svgRoot) {
        svgRoot.style.pointerEvents = 'none';
      }
    }
    
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle drag movement
  const handleMouseMove = (e) => {
    if (!dragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setPosition({
      x: position.x + dx,
      y: position.y + dy
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // End dragging
  const handleMouseUp = () => {
    setDragging(false);
    
    // Re-enable pointer events on SVG when dragging ends
    const svgObj = document.getElementById('floorPlanSVG');
    if (svgObj && svgObj.contentDocument) {
      const svgRoot = svgObj.contentDocument.querySelector('svg');
      if (svgRoot) {
        svgRoot.style.pointerEvents = 'auto';
      }
    }
  };

  // Function to colorize SVG workstations - extracted for reuse
  const colorizeSvg = () => {
    const svgObj = document.getElementById('floorPlanSVG');
    if (!svgObj || !svgObj.contentDocument) return false;
    
    const svgDoc = svgObj.contentDocument;
    
    // Find all workstation elements
    const svgWorkstations = Array.from(svgDoc.querySelectorAll('g[data-cell-id]'));
    if (!svgWorkstations.length) return false;
    
    console.log('Colorizing', svgWorkstations.length, 'workstation elements with', workstations.length, 'data items');
    
    // Helper function to find matching workstation
    const findMatchingWorkstation = (wsId) => {
      // 1. Exact modelName match ONLY - we want to be VERY strict
      const wsData = workstations.find(ws => ws.modelName === wsId);
      return wsData;
    };
        
        // Process each workstation
        svgWorkstations.forEach(ws => {
          const id = ws.getAttribute('data-cell-id');
          if (!id) return;
          
          // Default color is RED (unassigned)
          let color = colors.unassigned;
          let isITEquipment = false;
          
          // IT Equipment is BLUE  Add more here for ESC check Datacell id na naka embed sa floorMap
          if (id.startsWith('SVR') || id === 'SVR02' || id === 'SVR001' || 
              id.startsWith('BR') || id === 'BR01' || id === 'WSM090') {
            color = colors.it_equipment;
            isITEquipment = true;
          } else {
            // Otherwise, check workstation status
            const wsData = findMatchingWorkstation(id);
            
            if (wsData) {
              // Check status based on employee and assets
              if (wsData.empID && wsData.assetCount > 0) {
                // Complete - has both employee and assets
                color = colors.complete;
              } else if (wsData.empID || wsData.assetCount > 0) {
                // Incomplete - has either employee or assets but not both
                color = colors.incomplete;
              } else {
                // Unassigned - has neither employee nor assets
                color = colors.unassigned;
              }
            }
          }
          
      // Apply the color in multiple ways to ensure it works
      
      // Method 1: Set fill attribute
      ws.setAttribute('fill', color);
      
      // Method 2: Style property
      ws.style.fill = color;
      
      // Method 3: Inline style attribute with !important
      let currentStyle = ws.getAttribute('style') || '';
      // Remove any existing fill styles
      currentStyle = currentStyle.replace(/fill:[^;]+;?/g, '');
      // Add our fill style
      currentStyle += '; fill: ' + color + ' !important;';
      ws.setAttribute('style', currentStyle);
      
      // Method 4: Add a class based on color
      ws.classList.remove('red-workstation', 'orange-workstation', 'green-workstation', 'blue-workstation');
      if (color === colors.unassigned) ws.classList.add('red-workstation');
      else if (color === colors.incomplete) ws.classList.add('orange-workstation');
      else if (color === colors.complete) ws.classList.add('green-workstation');
      else if (color === colors.it_equipment) ws.classList.add('blue-workstation');
      
      // Make sure all child elements with fills also get colored
      const children = ws.querySelectorAll('*[fill]');
      children.forEach(child => {
        child.setAttribute('fill', color);
        child.style.fill = color;
      });
      
      // Store original color for hover effect
      ws.setAttribute('data-original-fill', color);
      ws.style.transition = "fill 0.2s, stroke 0.2s";
      
      // MAKE WORKSTATION CLICKABLE - ensure IT equipment is also clickable
      ws.style.pointerEvents = 'auto';
      ws.style.cursor = 'pointer';
      
      // Remove any existing event listeners to prevent duplicates
      ws.onclick = null;
      ws.onmouseenter = null;
      ws.onmouseleave = null;
      
      // Add click handler
      ws.onclick = function(e) {
        e.stopPropagation();
        console.log('Clicked: ' + id);
        
      // Find if this workstation has an employee
       const wsData = findMatchingWorkstation(id);
  
      if (wsData && wsData.empID) {
     // If there's an employee assigned, go directly to employee assets page
    window.location.href = `/employee-assets/${wsData.empID}`;
   } else {
    // Otherwise, show the modal to assign employee
        // For both IT equipment and regular workstations, show the modal 
        // (The modal will handle different workstation types)
        const event = new CustomEvent('showWorkstationModal', {
          detail: { workstationId: id }
        });
        window.dispatchEvent(event);
      }
    };
      
      // Add hover effect
      ws.onmouseenter = function() {
        this.setAttribute('data-temp-fill', this.getAttribute('fill'));
        this.style.fill = '#3498db'; // Light blue hover color
        this.setAttribute('fill', '#3498db');
        this.style.stroke = '#ffffff';
        this.style.strokeWidth = '2';
        this.style.cursor = 'pointer';
      };
      
      ws.onmouseleave = function() {
        const origColor = this.getAttribute('data-original-fill');
        this.style.fill = origColor;
        this.setAttribute('fill', origColor);
        this.style.stroke = '#ffffff';
        this.style.strokeWidth = '1';
      };
    });
    
    return true;
  };

  // Handle SVG events and initialize defaults
  useEffect(() => {
    const handleSvgLoad = () => {
      const svgObj = document.getElementById('floorPlanSVG');
      if (!svgObj || !svgObj.contentDocument) return;
      
      svgRef.current = svgObj;
      const svgDoc = svgObj.contentDocument;
      
      // Disable pointer events only on the background images
      const images = svgDoc.querySelectorAll('image');
      images.forEach(img => {
        img.style.pointerEvents = 'none';
      });
      
      // Prevent right-click context menu on SVG
      const svgRoot = svgDoc.querySelector('svg');
      if (svgRoot) {
        svgRoot.addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });
      }
      
      // Apply colorization when SVG is loaded
      if (workstations.length > 0) {
        colorizeSvg();
      }
    };
    
    const svgObj = document.getElementById('floorPlanSVG');
    if (svgObj) {
      svgObj.addEventListener('load', handleSvgLoad);
      
      // Try immediately if already loaded
      if (svgObj.contentDocument) {
        handleSvgLoad();
      }
      
      return () => {
        svgObj.removeEventListener('load', handleSvgLoad);
      };
    }
  }, [workstations]);

  // Reapply colorization when workstation data changes
  useEffect(() => {
    if (workstations.length > 0 && svgRef.current?.contentDocument) {
      colorizeSvg();
    }
  }, [workstations]);

  // Add necessary CSS for the SVG elements
  useEffect(() => {
    // Create and add style element
    const style = document.createElement('style');
    style.id = 'svg-color-styles';
    style.textContent = `
      /* Allow SVG to be interactive for workstation clicks */
      #floorPlanSVG {
        pointer-events: auto;
      }
      
      /* Disable clicks on image */
      #floorPlanSVG image {
        pointer-events: none !important;
      }
      
      /* Make workstations clickable */
      #floorPlanSVG g[data-cell-id] {
        pointer-events: auto !important;
        cursor: pointer !important;
        transition: fill 0.2s, stroke 0.2s;
      }
      
      /* Default - RED (unassigned) */
      #floorPlanSVG g[data-cell-id],
      #floorPlanSVG .red-workstation {
        fill: ${colors.unassigned} !important;
      }
      
      /* ORANGE (incomplete) */
      #floorPlanSVG .orange-workstation {
        fill: ${colors.incomplete} !important;
      }
      
      /* GREEN (complete) */
      #floorPlanSVG .green-workstation {
        fill: ${colors.complete} !important;
      }
      
      /* BLUE (IT equipment) */
      #floorPlanSVG .blue-workstation,
      #floorPlanSVG g[data-cell-id="SVR02"],
      #floorPlanSVG g[data-cell-id="SVR001"],
      #floorPlanSVG g[data-cell-id="BR01"],
      #floorPlanSVG g[data-cell-id="WSM090"],
      #floorPlanSVG g[data-cell-id^="SVR"],
      #floorPlanSVG g[data-cell-id^="BR"] {
        fill: ${colors.it_equipment} !important;
        pointer-events: auto !important;
        cursor: pointer !important;
      }
      
      /* Hover state */
      #floorPlanSVG g[data-cell-id]:hover {
        fill: #3498db !important;
        cursor: pointer !important;
        stroke: #ffffff !important;
        stroke-width: 2px !important;
      }
      
      /* Zoom controls styling */
      .zoom-controls {
        position: absolute;
        bottom: 20px;
        right: 20px;
        display: flex;
        gap: 8px;
        z-index: 10;
      }
      
      .zoom-btn {
        background: #273C45;
        color: white;
        border: none;
        border-radius: 4px;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      }
      
      .zoom-btn:hover {
        background: #38505c;
      }
      
      /* Cursor styling */
      .draggable {
        cursor: default;
      }
      
      .dragging {
        cursor: grabbing;
      }
    `;
    
    document.head.appendChild(style);
    
    // Cleanup function
    return () => {
      const styleElement = document.getElementById('svg-color-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [colors]); // Only re-run if colors change

  return (
    <div className="relative bg-[#0C181C] rounded-lg overflow-hidden w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
          <div className="w-8 h-8 border-t-2 border-b-2 border-[#41b853] rounded-full animate-spin"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-red-500 bg-opacity-20 text-red-100 p-2 rounded z-10">
          {error}
        </div>
      )}
      
      {/* SVG Floor Plan with zoom and pan */}
      <div 
        className={`w-full h-full ${dragging ? 'dragging' : 'draggable'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center',
            width: '100%',
            height: '100%',
            transition: dragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <object 
            id="floorPlanSVG" 
            data="/svg/ASCL_FloorPlan.svg"
            type="image/svg+xml" 
            width="100%" 
            height="100%" 
          />
        </div>
      </div>
      
      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button 
          className="zoom-btn" 
          onClick={() => setScale(Math.min(scale * 1.2, 5))}
          title="Zoom In"
        >
          +
        </button>
        <button 
          className="zoom-btn" 
          onClick={() => setScale(Math.max(scale / 1.2, 0.5))}
          title="Zoom Out"
        >
          -
        </button>
        <button 
          className="zoom-btn" 
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          title="Reset View"
        >
          ↺
        </button>
      </div>
      
      {/* WorkstationAssignModal */}
      <WorkstationAssignModal 
        isOpen={showModal}
        onClose={handleModalClose}
        workstationId={selectedWorkstationId}
      />
    </div>
  );
};

export default FloorMap;