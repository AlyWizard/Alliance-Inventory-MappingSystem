import { useState, useEffect } from 'react';
import axios from 'axios';

// AccountModal component that matches your design
const AccountModal = ({ isOpen, onClose }) => {
  // State for the form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [currentUserPassword, setCurrentUserPassword] = useState('');
  
  // State for existing accounts
  const [accounts, setAccounts] = useState([]);
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      axios.get('http://localhost:3001/api/users')
        .then(response => setAccounts(response.data))
        .catch(error => console.error('Error fetching users:', error));
    }
  }, [isOpen]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!adminPassword) {
      alert('Please enter the admin password for verification.');
      return;
    }

    try {
      // Verify admin password
      const verifyResponse = await axios.post('http://localhost:3001/api/login', {
        username: 'admin',
        password: adminPassword
      });

      if (verifyResponse.status !== 200 || !verifyResponse.data.user) {
        alert('Invalid admin password');
        return;
      }
    } catch (err) {
      console.error('Admin verification error:', err);
      alert('Invalid admin password');
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      if (isEditing) {
        if (!password) {
          alert('Please enter a new password for the user.');
          return;
        }

        await axios.put(`http://localhost:3001/api/users/${editingUserId}`, {
          username,
          password,
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
        alert('Account updated successfully!');
      } else {
        await axios.post('http://localhost:3001/api/users', { 
          username,
          password,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
      }
      // Refresh the accounts list after successful creation or update
      const response = await axios.get('http://localhost:3001/api/users');
      setAccounts(response.data);
      // Reset form
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setAdminPassword('');
      setIsEditing(false);
      setEditingUserId(null);
      
    } catch (error) {
      console.error('Error creating/updating account:', error);
      alert('Failed to submit account form');
    }
  };
  
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this account?');
    if (!confirmDelete) return;

    if (editingUserId === currentUser?.id) {
      alert('You cannot delete the account currently in use.');
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/api/users/${editingUserId}`, {
        headers: { 'current-user-id': currentUser?.id }
      });
      alert('Account deleted successfully!');

      // Refresh and reset
      const response = await axios.get('http://localhost:3001/api/users');
      setAccounts(response.data);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setAdminPassword('');
      setIsEditing(false);
      setEditingUserId(null);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 text-white rounded-lg w-full max-w-4xl mx-4 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side - Account Creation */}
          <div className="border-b md:border-b-0 md:border-r border-gray-600 pb-6 md:pb-0 md:pr-8">
            <div className="flex items-center mb-6">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingUserId(null);
                    setUsername('');
                    setPassword('');
                    setConfirmPassword('');
                    setAdminPassword('');
                    setIsDeleteMode(false);
                  }}
                  className="text-gray-400 hover:text-white mr-2"
                >
                  ←
                </button>
              )}
              <h2 className="text-2xl font-bold">{isEditing ? 'Edit Account' : 'Account Creation'}</h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-700 rounded py-3 px-4 text-white"
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 rounded py-3 px-4 text-white"
                  placeholder="Enter password"
                  required
                />
              </div>
              
              <div className="mb-8">
                <label className="block text-gray-400 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-700 rounded py-3 px-4 text-white"
                  placeholder="Confirm password"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Admin Password (for verification)</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-gray-700 rounded py-3 px-4 text-white"
                  placeholder="Enter your admin password"
                  required
                />
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition duration-200"
                >
                  {isEditing ? 'Edit Account' : 'Add Account'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="ml-4 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full transition duration-200"
                  >
                    Delete Account
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Right side - Existing Accounts */}
          <div className="md:pl-8">
            <h2 className="text-2xl font-bold mb-6">Existing Accounts</h2>
            
            <div className="overflow-y-auto max-h-[500px]">
              <table className="min-w-full text-left text-white">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="py-2 px-4">ID</th>
                    <th className="py-2 px-4">Username</th>
                    <th className="py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(account => (
                    <tr key={account.id} className="bg-gray-700 bg-opacity-50">
                      <td className="py-2 px-4">{account.id}</td>
                      <td className="py-2 px-4">{account.username}</td>
                      <td className="py-2 px-4 space-x-2">
                        <button
                          className={`text-orange-400 hover:text-orange-300 font-medium ${account.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => {
                            if (account.id === currentUser?.id) return;
                            setIsEditing(true);
                            setEditingUserId(account.id);
                            setUsername(account.username);
                            setPassword('');
                            setConfirmPassword('');
                            setAdminPassword('');
                            setIsDeleteMode(false);
                          }}
                          disabled={account.id === currentUser?.id}
                        >
                          EDIT
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Close button (can be added if needed) */}
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Demo component to show the modal usage
const AccountManagementDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Account Management System</h1>
      
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Open Account Manager
      </button>
      
      <AccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default AccountModal;