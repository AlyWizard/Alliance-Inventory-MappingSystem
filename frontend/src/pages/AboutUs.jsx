import React from 'react';
import escLogo from '../assets/ESCLogo.png';
import escText from '../assets/ESCText.png';
import ShandAlyssaPic from '../assets/ShandAlyssaPic.png';

const TechStack = ({ title, technologies }) => {
  return (
    <div className="p-2">
      <h3 className="font-medium text-lg mb-2 text-gray-200">{title}</h3>
      <ul className="space-y-1">
        {technologies.map((tech, index) => (
          <li key={index} className="flex items-center text-sm text-gray-300 hover:text-white transition-colors">
            <span className="mr-2">•</span>
            {tech}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProfileCard = () => {
  return (
    <div className="relative w-full h-[38rem] overflow-hidden">
      <img src={ShandAlyssaPic} alt="Shand Alyssa Pic" className="h-30 w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-slate-900/40 flex items-center">
        <div className="flex w-full justify-between px-16">
          <div className="ml-20 transform -rotate-6">
            <span className="font-bold text-5xl text-white drop-shadow-lg">Shan</span>
          </div>
          <div className="mr-60 transform -rotate-6">
            <span className="font-bold text-5xl text-white drop-shadow-lg">Alyssa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AboutUs = () => {
  return (
    <div className="flex bg-slate-800 min-h-screen text-gray-100">

      {/* Sidebar */}
      <aside className="w-54 min-h-screen max-h-screen flex-shrink-0 bg-[#16282F] p-4 flex flex-col">
        {/* Logo */}
                  <div className="ml-12 flex items-center gap-2 mb-6">
                    <div className="bg-[#1e4975] w-12 h-12 rounded flex items-center justify-center">
                      <img src={escLogo} alt="ESC Logo" className="h-10 w-10" />
                    </div>
                    <div className="w-18 h-12 rounded flex items-center justify-center">
                      <img src={escText} alt="ESC Text" className="h-16 w-18" />
                    </div>
                  </div>

        {/* Floor Mapping Container */}
        <div className="bg-[#1c3640] rounded-md p-3 mb-4" style={{ width: '220px', height: '70px' }} onClick={() => window.location.href = '/dashboard'}>
          <button className="bg-[#41b853] text-white px-4 py-2 w-full rounded mb-3 font-semibold">
            Floor Mapping
          </button>
        </div>

        {/* Inventories Container */}
        <div className="mb-4">
          <h2 className="text-lg mb-2 text-white">Inventories</h2>
          <div className="bg-[#1c3640] rounded-md p-3">
            <div className="space-y-2">
              {[
                ['👤', 'Employees', '/employees'],
                ['🏭', 'Manufacturers', '/manufacturer'],
                ['🏷️', 'Categories', '/categories'],
                ['💻', 'Models', '/model'],
                ['📦', 'Assets', '/assets'],
              ].map(([icon, label, path]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 hover:bg-opacity-10 hover:bg-white p-2 rounded cursor-pointer"
                  onClick={() => window.location.href = path}
                >
                  <span className="text-gray-400">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Buttons Container */}
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

          <div className="h-1 bg-[#273C45] my-2"></div>

          <button
            onClick={() => window.location.href = '/'}
            className="bg-[#273C45] text-white py-3 px-4 rounded-xl text-sm font-semibold w-full mt-4 border-4"
            style={{ borderColor: '#273C45' }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-5xl font-light mb-8 text-gray-200">About Us</h1>

        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg">
          <ProfileCard />

          <div className="ml-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4">
            <TechStack
              title="Frontend"
              technologies={[
                'React.js',
                'Vite',
                'Tailwind CSS',
                'HTML5',
                'CSS3',
                'JavaScript (ES6+)',
              ]}
            />
            <TechStack
              title="Backend"
              technologies={[
                'Node.js',
                'Express.js',
                'PHP',
                'MySQL',
              ]}
            />
            <TechStack
              title="Database"
              technologies={[
                'XAMPP',
                'phpMyAdmin',
              ]}
            />
            <TechStack
              title="Tools"
              technologies={[
                'Visual Studio Code',
                'Git',
                'GitHub',
                'Terminal',
              ]}
            />
            <TechStack
              title="Design & UI"
              technologies={[
                'Figma',
                'Iconify',
                'Font Awesome',
              ]}
            />
            <TechStack
              title="Libraries & Plugins"
              technologies={[
                'React Router',
                'Redux',
                'Socket.IO',
                'Postman',
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;