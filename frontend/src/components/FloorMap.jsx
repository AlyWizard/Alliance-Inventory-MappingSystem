// src/components/FloorMap.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FloorMap = ({ currentFloor, onSelectWorkstation }) => {
  const [workstations, setWorkstations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status colors
  const colors = {
    unassigned: '#e63946', // Red
    incomplete: '#ff9f1c',  // Orange
    complete: '#41b853',    // Green
    it_equipment: '#00b4d8' // Blue
  };

  // Load workstation data from backend
  useEffect(() => {
    const fetchWorkstations = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/workstations');
        setWorkstations(response.data);
      } catch (error) {
        console.error('Error loading workstations:', error);
        // Use empty array if API fails
        setWorkstations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkstations();
  }, [currentFloor]);

  // Setup SVG interactions when the floor plan loads
  useEffect(() => {
    const setupSvg = () => {
      const svgObject = document.getElementById('floorPlanSVG');
      if (!svgObject) return;

      // When SVG loads, setup the workstation colors and click events
      const onSvgLoad = () => {
        if (!svgObject.contentDocument) return;
        
        // Get all workstation elements from SVG
        const svgDoc = svgObject.contentDocument;
        const workstationElements = svgDoc.querySelectorAll('.WorkStation');
        
        console.log(`Found ${workstationElements.length} workstations in the SVG`);
        
        // Set color and click handler for each workstation
        workstationElements.forEach(element => {
          // Get workstation ID
          const wsId = element.getAttribute('data-cell-id');
          if (!wsId) return;
          
          // Find workstation data by ID
          const wsData = workstations.find(ws => ws.workStationID === wsId);
          
          // Set the color based on status
          let color = colors.unassigned; // Default: red (unassigned)
          
          if (wsData) {
            if (wsData.empID) {
              // Has employee assigned
              color = wsData.assetCount > 0 ? colors.complete : colors.incomplete;
            } else if (wsData.assetCount > 0) {
              // Has assets but no employee
              color = colors.it_equipment;
            }
          }
          
          // Apply color
          element.setAttribute('fill', color);
          
          // Add click event
          element.addEventListener('click', (event) => {
            event.stopPropagation();
            if (onSelectWorkstation) {
              onSelectWorkstation(wsId, wsData);
            }
          });
          
          // Add hover effect
          element.addEventListener('mouseenter', function() {
            this.setAttribute('original-fill', this.getAttribute('fill'));
            this.style.stroke = '#ffffff';
            this.style.strokeWidth = '2';
            this.style.cursor = 'pointer';
            this.setAttribute('fill', '#3498db'); // Highlight blue
          });
          
          element.addEventListener('mouseleave', function() {
            this.style.stroke = '#ffffff';
            this.style.strokeWidth = '1';
            this.setAttribute('fill', this.getAttribute('original-fill'));
          });
        });
      };
      
      // Check if SVG is already loaded
      if (svgObject.contentDocument && svgObject.contentDocument.querySelector('svg')) {
        onSvgLoad();
      } else {
        // Wait for SVG to load
        svgObject.addEventListener('load', onSvgLoad);
      }
    };
    
    // Wait a moment for the SVG to be in the DOM
    setTimeout(setupSvg, 500);
    
    // Cleanup
    return () => {
      const svgObject = document.getElementById('floorPlanSVG');
      if (svgObject) {
        svgObject.removeEventListener('load', () => {});
      }
    };
  }, [workstations, currentFloor, onSelectWorkstation]);

  return (
    <div className="relative bg-[#0C181C] rounded-lg overflow-hidden w-full h-[405px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
          <div className="w-8 h-8 border-t-2 border-b-2 border-[#41b853] rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* SVG Floor Plan */}
      <object 
        id="floorPlanSVG" 
        data={`/svg/ASCL_FloorPlan${currentFloor === '20F' ? '_20F' : ''}.svg`}
        type="image/svg+xml" 
        width="100%" 
        height="100%" 
      />
    </div>
  );
};

export default FloorMap;