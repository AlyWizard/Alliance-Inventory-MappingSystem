import React, { useEffect } from 'react';
import AccountModal from '../components/modal/AccountCreation';
import { useState } from 'react';
import escLogo from '../assets/ESCLogo.png';
import map15F from '../assets/ESC Mapping 15th.png';
import map20F from '../assets/ESC Mapping 20th.png';

function Dashboard() {
  useEffect(() => {
    // This would be the place to initialize workstations if needed
    // Similar to the addWorkstations function in the HTML reference
  }, []);

  const handleClick = (workstationId) => {
    alert(`Clicked on ${workstationId}`);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <div className="mt-auto">
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
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#162F20] text-white py-3 px-4 rounded-xl text-sm font-semibold w-full mt-4 border-4"
            style={{ borderColor: '#4D8D36' }}
          >
            Account Creation
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto">
        <div className="flex flex-col items-center justify-center gap-4 h-full">
          {/* 20F */}
          <div className="bg-[#16282F] w-full p-4 rounded-lg grid items-center justify-center">
            <div className="flex items-start justify-center w-full">
              {/*<div className="absolute top-3 right-15 text-2xl font-bold text-[#16282F] rounded-lg overflow-hidden w-[1200px] h-[405px]">
              {/* Container for the Map */}
              <div className="relative bg-[#0C181C] border-6 border-[#16282F] rounded-lg overflow-hidden w-[1290] h-[405px]">
                <div className="relative p-4 flex items-center justify-center mx-auto my-0" style={{ height: '405px', flex: '0 0 auto', position: 'relative' }}>
                  <div className="w-[1290] h-[405px] relative grid items-center justifsy-center">
                    <img src={map20F} alt="20F Floor Map" className="block w-[1290px] h-[405px] object-none" />

                    <div className="absolute top-[43px] left-[240px] h-3 w-5 bg-blue-400 cursor-pointer hover:bg-blue-600"></div>
                    <div className="absolute top-[63px] left-[240px] h-3 w-5 bg-blue-400 cursor-pointer hover:bg-blue-600"></div>
                    <div className="absolute top-[48px] left-[269px] h-3 w-5 rotate-90 bg-green-500 cursor-pointer hover:bg-green-600"></div>
                    <div className="absolute top-[68px] left-[295px] h-3 w-5 bg-green-500 cursor-pointer hover:bg-green-600"></div>
                    <div className="absolute top-[68px] left-[322px] h-3 w-5 bg-green-500 cursor-pointer hover:bg-green-600"></div>

                    <div className="absolute top-[162px] left-[240px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[187px] left-[240px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[212px] left-[240px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[237px] left-[240px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[162px] left-[257px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[187px] left-[257px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[212px] left-[257px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[237px] left-[257px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[141px] left-[249px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[162px] left-[300px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[187px] left-[300px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[212px] left-[300px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[237px] left-[300px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[162px] left-[317px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[187px] left-[317px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[212px] left-[317px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[237px] left-[317px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[141px] left-[309px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[162px] left-[360px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[187px] left-[360px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[212px] left-[360px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[237px] left-[360px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[162px] left-[377px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[187px] left-[377px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[212px] left-[377px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[237px] left-[377px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[141px] left-[369px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[162px] left-[420px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[187px] left-[420px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[212px] left-[420px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[237px] left-[420px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[212px] left-[465px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[237px] left-[465px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[186px] left-[503px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[186px] left-[520px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[238px] left-[550px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[213px] left-[492px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[213px] left-[517px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[238px] left-[488px] h-3 w-5 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[242px] left-[527px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[93px] left-[495px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[93px] left-[519px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[93px] left-[543px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[93px] left-[567px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[64px] left-[495px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[64px] left-[519px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[64px] left-[543px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[64px] left-[567px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[48px] left-[495px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[48px] left-[519px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[48px] left-[543px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[48px] left-[567px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[203px] left-[575px] h-3 w-5 bg-red-500 rotate-90 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[93px] left-[858px] h-3 w-5 bg-red-500 rotate-[65deg] cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[263px] left-[745px] h-3 w-5 bg-red-500 rotate-[35deg] cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[193px] left-[975px] h-3 w-5 bg-red-500 rotate-[60deg] cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[63px] left-[670px] h-3 w-5 bg-red-500 rotate-90 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[63px] left-[687px] h-3 w-5 bg-red-500 rotate-90 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[93px] left-[770px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[93px] left-[794px] h-3 w-5 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[228px] left-[745px] h-3 w-5 bg-red-500 rotate-[125deg] cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[208px] left-[760px] h-3 w-5 bg-red-500 rotate-[125deg] cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[238px] left-[758px] h-3 w-5 bg-red-500 rotate-[125deg] cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[218px] left-[773px] h-3 w-5 bg-red-500 rotate-[125deg] cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[238px] left-[830px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[217px] left-[818px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[230px] left-[844px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[209px] left-[832px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[196px] left-[806px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[188px] left-[820px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[175px] left-[804px] h-3 w-5 rotate-[150deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[173px] left-[850px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[165px] left-[864px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[193px] left-[861px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[185px] left-[875px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[214px] left-[873px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[206px] left-[887px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[152px] left-[847px] h-3 w-5 rotate-[150deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[148px] left-[895px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[140px] left-[909px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[168px] left-[906px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[160px] left-[920px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[188px] left-[918px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[180px] left-[931px] h-3 w-5 rotate-[60deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[128px] left-[892px] h-3 w-5 rotate-[150deg] bg-red-500 cursor-pointer hover:bg-red-600"></div>
                  </div>
                </div>
              </div>

              {/* Separate Container for 20F Text */}
              <div className="flex flex-col items-start justify-start ml-4">
                <div className="text-2xl font-bold text-[#41b853]">20F</div>
              </div>
            </div>
          </div>

          {/* 15F */}
          <div className="bg-[#16282F] w-full p-4 rounded-lg grid items-center justify-center">
            <div className="flex items-start justify-center w-full">
              {/* Container for the Map */}
              <div className="relative bg-[#0C181C] border-6 border-[#16282F] rounded-lg overflow-hidden w-[1290] h-[370px]">
                <div className="relative p-4 flex items-center justify-center mx-auto my-0" style={{ height: '380px', flex: '0 0 auto', position: 'relative' }}>
                  <div className="w-[1290] h-[380px] relative grid items-center justify-center">
                    <img src={map15F} alt="15F Floor Map" className="block w-[1290px] h-[380px] object-none"/>

                    <div className="absolute top-[232px] left-[645px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[260px] left-[645px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[232px] left-[660px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[260px] left-[660px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[232px] left-[715px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[260px] left-[715px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[288px] left-[715px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[316px] left-[715px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[232px] left-[730px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[260px] left-[730px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[288px] left-[730px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[316px] left-[730px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[232px] left-[785px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[260px] left-[785px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[288px] left-[785px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[316px] left-[785px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[232px] left-[800px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[260px] left-[800px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[288px] left-[800px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[316px] left-[800px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[232px] left-[862px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[260px] left-[862px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[288px] left-[862px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[316px] left-[862px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[232px] left-[877px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[260px] left-[877px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    
                    <div className="absolute top-[82px] left-[715px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[110px] left-[715px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[138px] left-[715px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[82px] left-[730px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[110px] left-[730px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[138px] left-[730px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>

                    <div className="absolute top-[82px] left-[785px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[110px] left-[785px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[138px] left-[785px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[82px] left-[800px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[110px] left-[800px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    <div className="absolute top-[138px] left-[800px] h-3 w-6 rotate-90 bg-red-500 cursor-pointer hover:bg-red-600"></div>
                    
                  </div>
                </div>
              </div>

              {/* Separate Container for 15F Text */}
              <div className="flex flex-col items-start justify-start ml-4">
                <div className="text-2xl font-bold text-[#41b853]">15F</div>
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
      {isModalOpen && (
        <AccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}

export default Dashboard;