import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Learning from './pages/Learning';
import Games from './pages/Games';
import Daily from './pages/Daily';
import Community from './pages/Community';
import Assessment from './pages/Assessment';
import Login from './pages/Login';
import CourseDetail from './CourseDetail'; // Create this component
import Blog from './pages/Blog';
import { AuthProvider } from './pages/AuthContext';
import Chatbot from './pages/Chatbot';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LoginPopup from './pages/Login';
import About from './pages/About';
import Articles from './pages/Articles ';
import NotFound from './pages/NotFound'; // Import the new NotFound component

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoginOpen(true); // Show login popup after 1 minute
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-neutral-50">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/coursedetail" element={<CourseDetail />} /> {/* Fixed typo from "ousedetail" */}
              <Route path="/games" element={<Games />} />
              <Route path="/daily" element={<Daily />} />
              <Route path="/community" element={<Community />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route
                path="/login"
                element={<Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />}
              />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/about" element={<About />} />
              <Route path="/articles" element={<Articles />} />
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <Chatbot />
          {/* Login Popup */}
          <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;