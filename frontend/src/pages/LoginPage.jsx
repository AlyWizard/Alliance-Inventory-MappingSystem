import { useState } from 'react';
import axios from 'axios';
import escLogo from '../assets/ESCLogo.png';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      
      console.log('Login attempt with:', { username });
      
      try {
        const res = await axios.post('http://localhost:3001/api/login', {
          username,
          password
        });
        
        console.log('Response received:', res.data);
        
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        toast.success('Login successful!');
        navigate('/dashboard');
      } catch (err) {
        console.error('Login error:', err);
        
        let errorMessage = 'Login failed';
        
        if (err.response) {
          errorMessage = err.response.data.error || 'Server error';
        } else if (err.request) {
          errorMessage = 'No response from server';
        } else {
          errorMessage = err.message;
        }
        
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <div className="w-screen h-screen bg-[#0f2d25] flex items-center justify-center overflow-auto">
      <div className="flex flex-col items-center justify-center p-4">

        {/* Logo and Text */}
        <div className="flex items-center justify-center mb-6">
          <img src={escLogo} alt="ESC Logo" className="h-24 w-24" />
          <div className="ml-3 text-[#bef7d8]">
            <h1 className="text-7xl font-bold leading-none">Esc</h1>
            <span className="text-sm tracking-widest">CORPORATION</span>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-[#1e3b30] p-8 rounded-2xl shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl text-white font-semibold">Login</h2>
            <p className="text-sm text-gray-300">Admin Access only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full p-3 bg-[#2d4c41] text-white rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full p-3 bg-[#2d4c41] text-white rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-green-600 hover:bg-green-700 transition-colors text-white font-medium p-3 rounded-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Logging in...' : 'Log-in'}
            </button>
          </form>

          <div className="text-center mt-4">
            <a href="#" className="text-gray-400 hover:text-gray-300 text-sm">
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;