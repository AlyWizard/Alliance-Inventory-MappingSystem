import React, { useState } from 'react';
import AddAssetModal from '../AssetModals/AddAssetModal';
import AddModelModal from '../ModelsModals/AddModelModal';
import AddCategoryModal from '../CategoriesModals/AddCategoryModal';
import AddManufacturerModal from '../ManufacturersModals/AddManufacturerModal';
import AddEmployeeModal from '../EmployeeModals/AddEmployeeModal';
import { 
  Monitor, 
  Computer, 
  Triangle, 
  BarChart3, 
  User, 
} from 'lucide-react';

const CreateNewModal = ({ isOpen, onClose, onAssetAdd }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isManufacturerModalOpen, setIsManufacturerModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  const categories = [
    { id: 'assets', name: 'Assets', icon: Monitor },
    { id: 'models', name: 'Models', icon: Computer },
    { id: 'categories', name: 'Categories', icon: Triangle },
    { id: 'manufacturers', name: 'Manufacturers', icon: BarChart3 },
    { id: 'employees', name: 'Employees', icon: User },
  ];

  // Handler for category click
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    // Open the corresponding modal for the selected category
    if (categoryId === 'assets') setIsAssetModalOpen(true);
    else if (categoryId === 'models') setIsModelModalOpen(true);
    else if (categoryId === 'categories') setIsCategoryModalOpen(true);
    else if (categoryId === 'manufacturers') setIsManufacturerModalOpen(true);
    else if (categoryId === 'employees') setIsEmployeeModalOpen(true);
    // (departments/companies could be added here)
  };

  return isOpen && (
    <>
      {/* Main modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
          <h1 className="text-white text-3xl font-semibold mb-2">Create New</h1>
          <p className="text-slate-400 text-lg mb-8">Select a category</p>
          
          <div className="grid grid-cols-5 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`
                    bg-slate-700 rounded-xl p-6 flex flex-col items-center justify-center
                    cursor-pointer transition-all duration-200 hover:bg-slate-600
                    ${selectedCategory === category.id ? 'ring-2 ring-teal-400 bg-slate-600' : ''}
                    aspect-square
                  `}
                >
                  <IconComponent 
                    size={48} 
                    className="text-slate-300 mb-4"
                  />
                  <span className="text-white text-sm font-medium text-center">
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Entity modals */}
      <AddAssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSuccess={() => {
          alert('Added successfully!');
          window.location.href = '/dashboard';
        }}
      />
      <AddModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onSuccess={() => {
          alert('Added successfully!');
          window.location.href = '/dashboard';
        }}
      />
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          alert('Added successfully!');
          window.location.href = '/dashboard';
        }}
      />
      <AddManufacturerModal
        isOpen={isManufacturerModalOpen}
        onClose={() => setIsManufacturerModalOpen(false)}
        onSuccess={() => {
          alert('Added successfully!');
          window.location.href = '/dashboard';
        }}
      />
      <AddEmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSuccess={() => {
          alert('Added successfully!');
          window.location.href = '/dashboard';
        }}
      />
    </>
  );
};

export default CreateNewModal;