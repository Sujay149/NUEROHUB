/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, BookOpen, Gamepad2, Calendar, Users, Brain, Settings, FileText, MessageSquare, User, LogOut, Sun, Moon } from 'lucide-react';
import { SpeechText } from '../components/speach';
import { useAuth } from '../pages/AuthContext';
import Login from '../pages/Login';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState<'login' | 'logout' | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Start with dark theme as default
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Learning', href: '/learning', icon: BookOpen },
    { name: 'Games', href: '/games', icon: Gamepad2 },
    { name: 'Daily', href: '/daily', icon: Calendar },
    { name: 'Community', href: '/community', icon: Users },
    { name: 'Assessment', href: '/assessment', icon: Brain },
  ];

  const profileMenu = [
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Blog', href: '/blog', icon: FileText },
    { name: 'Articles', href: '/articles', icon: MessageSquare },
    { name: 'About', href: '/about', icon: FileText },
    { name: 'Logout', href: '#', icon: LogOut, onClick: () => handleLogout(), hide: !user },
  ];

  const handleLogout = () => {
    logout();
    setShowSuccess('logout');
    setIsProfileOpen(false);
    navigate('/login');
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    setShowSuccess('login');
  };

  const handleLoginClick = () => {
    setIsLoginOpen(true);
  };

  const handleCloseLogin = () => {
    setIsLoginOpen(false);
  };

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
    // Apply theme change to the document body or a parent container
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
  };

  const getUserInitials = () => {
    if (user && user.displayName) {
      const nameParts = user.displayName.split(' ');
      return nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[1][0]}`
        : nameParts[0][0];
    }
    return '';
  };

  useEffect(() => {
    if (user) {
      console.log('User Data:', {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
    }
  }, [user]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Initialize theme on component mount
  useEffect(() => {
    // Apply dark theme by default
    document.body.classList.add('dark-theme');
  }, []);

  return (
    <>
      <nav className="bg-black text-white shadow-lg z-50 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8" />
              <SpeechText>
                <span className="font-bold text-xl">NeuroHub</span>
              </SpeechText>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4 items-center">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.href ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <SpeechText>
                      <span>{item.name}</span>
                    </SpeechText>
                  </Link>
                );
              })}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-900 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label={isDarkTheme ? "Switch to Light Theme" : "Switch to Dark Theme"}
              >
                {isDarkTheme ? <Sun className="h-5 w-5 text-yellow-300" /> : <Moon className="h-5 w-5 text-gray-300" />}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                {user ? (
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    aria-label="User Profile"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={`${user.displayName || 'User'}'s Profile`}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          console.error('Image failed to load:', user.photoURL);
                          e.currentTarget.style.display = 'none';
                          const nextSibling = e.currentTarget.nextSibling as HTMLElement | null;
                          if (nextSibling) nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gray-700 rounded-full">
                        <SpeechText>
                          <span className="text-sm font-semibold">{getUserInitials()}</span>
                        </SpeechText>
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleLoginClick}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    aria-label="Login"
                  >
                    <User className="h-5 w-5" />
                  </button>
                )}
                {isProfileOpen && user && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-gradient-to-b from-gray-900 to-black border border-gray-800 transform origin-top-right transition-all duration-200 ease-in-out z-50">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <SpeechText>
                        <p className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</p>
                      </SpeechText>
                      <SpeechText>
                        <p className="text-xs text-gray-300 truncate">{user.email}</p>
                      </SpeechText>
                    </div>
                    <div className="py-1">
                      {profileMenu.map((item) => {
                        if (item.hide) return null;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={item.onClick || (() => setIsProfileOpen(false))}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                          >
                            <Icon className="h-4 w-4 text-gray-300" />
                            <SpeechText>
                              <span>{item.name}</span>
                            </SpeechText>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-900 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label={isDarkTheme ? "Switch to Light Theme" : "Switch to Dark Theme"}
              >
                {isDarkTheme ? <Sun className="h-5 w-5 text-yellow-300" /> : <Moon className="h-5 w-5 text-gray-300" />}
              </button>
              
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-md p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Toggle Menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden pb-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === item.href ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <SpeechText>
                      <span>{item.name}</span>
                    </SpeechText>
                  </Link>
                );
              })}

              {/* Mobile Profile Menu */}
              <div className="px-3 py-2">
                {user ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={`${user.displayName || 'User'}'s Profile`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Image failed to load:', user.photoURL);
                                e.currentTarget.style.display = 'none';
                                const nextSibling = e.currentTarget.nextSibling as HTMLElement | null;
                                if (nextSibling) nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-700 rounded-full">
                              <SpeechText>
                                <span className="text-sm font-semibold">{getUserInitials()}</span>
                              </SpeechText>
                            </div>
                          )}
                        </div>
                        <SpeechText>
                          <span>{user.displayName || 'Profile'}</span>
                        </SpeechText>
                      </div>
                    </button>
                    {isProfileOpen && (
                      <div className="w-full rounded-lg shadow-xl bg-gradient-to-b from-gray-900 to-black border border-gray-800 transition-all duration-200 ease-in-out">
                        <div className="px-4 py-3 border-b border-gray-800">
                          <SpeechText>
                            <p className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</p>
                          </SpeechText>
                          <SpeechText>
                            <p className="text-xs text-gray-300 truncate">{user.email}</p>
                          </SpeechText>
                        </div>
                        <div className="py-1">
                          {profileMenu.map((item) => {
                            if (item.hide) return null;
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={item.onClick || (() => setIsProfileOpen(false))}
                                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                              >
                                <Icon className="h-4 w-4 text-gray-300" />
                                <SpeechText>
                                  <span>{item.name}</span>
                                </SpeechText>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleLoginClick}
                    className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 transition-colors duration-200"
                  >
                    <User className="h-5 w-5" />
                    <SpeechText>
                      <span>Login</span>
                    </SpeechText>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Login Popup with type assertion as a temporary fix */}
      <Login
        isOpen={isLoginOpen}
        onClose={handleCloseLogin}
        onLoginSuccess={handleLoginSuccess}
        {...({} as any)} // Type assertion to bypass until Login.tsx is updated
      />

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-md shadow-lg animate-fade-in">
            <SpeechText>
              <span>{showSuccess === 'login' ? 'Login Successful!' : 'Logout Successful!'}</span>
            </SpeechText>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;