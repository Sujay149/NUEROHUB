/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Brain, BookOpen, Users, Activity, ChevronLeft, ChevronRight, MessageSquare, Globe, FileText, ArrowRight, Star, BarChart2, Phone, Mail, MapPin, Gamepad2 } from 'lucide-react';
import { SpeechText } from '../components/speach';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import Login from './Login';
const db = getFirestore();

const Home = () => {
  const [currentCourse, setCurrentCourse] = useState(0);
  const [currentGame, setCurrentGame] = useState(0);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showBreathPopup, setShowBreathPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const { user } = useAuth();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });


    const featuredCourses = [
      { title: 'Understanding ADHD', level: 'Beginner', duration: '2 hours', progress: 75, link: '/learning', logo: '/logos/adhd.png' },
      { title: 'Dyslexia Strategies', level: 'Intermediate', duration: '3 hours', progress: 50, link: '/learning', logo: '/logos/dyslexia.png' },
      { title: 'Autism Awareness', level: 'Advanced', duration: '4 hours', progress: 20, link: '/learning', logo: '/logos/autism.png' },
      { title: 'Sensory Integration', level: 'Beginner', duration: '1.5 hours', progress: 90, link: '/learning', logo: '/logos/sensory.png' },
      { title: "Time Management for ADHD", level: "Beginner", duration: "2 hours", progress: 30, link:'/learning', logo: '/logos/time-management.png' },
      { title: "OCD Coping Mechanisms", description: "Develop tools to manage obsessive-compulsive behaviors effectively.", status: "Completed", duration: "00:35", category: "Psychological", link: '/learning', logo: '/logos/ocd.png' },
      { title: "Bipolar Disorder Basics", description: "Gain insights into bipolar disorder and mood management techniques.", status: "Upcoming", duration: "00:45", category: "Mental Health", link: '/learning', logo: '/logos/bipolar.png' },
      { title: "Sensory Processing Skills", description: "Explore sensory sensitivities and ways to adapt daily routines.", status: "Watching", duration: "00:30", progress: "00:10", category: "Perception", link: '/learning', logo: '/logos/sensory-processing.png' },
      { title: "Down Syndrome Learning Strategies", description: "Discover tailored approaches to support learning with Down Syndrome.", status: "Upcoming", duration: "00:50", category: "Genetic", link: '/learning', logo: '/logos/down-syndrome.png' },
      { title: "Anatomy and Physiology", description: "Understand the structure and function of the human body.", status: "Completed", duration: "00:30", category: "Reading", link: '/learning', logo: '/logos/anatomy.png' },
      { title: "Pharmacology Basics", description: "Learn basic medical language for effective communication.", status: "Watching", duration: "00:30", progress: "00:30", category: "Social", link: '/learning', logo: '/logos/pharmacology.png' },
      { title: "Medical Ethics and Professionalism", description: "Understand ethical principles and professionalism in healthcare.", status: "Upcoming", duration: "00:30", category: "Neurological", link: '/learning', logo: '/logos/ethics.png' },
      { title: "Disease Pathophysiology", description: "Study the cellular and molecular basis of common diseases.", status: "Upcoming", duration: "00:30", category: "Motor Skills", link: '/learning', logo: '/logos/pathophysiology.png' },
    ];

  const featuredGames = [
    { id: "memory", title: "Memory Match",  logo: "https://cdn-icons-png.flaticon.com/512/808/808439.png", description: "Test your memory with this fun card-matching game!", rating: 4.5, category: "memory" , link: '/games'},
    { id: "word", title: "Word Puzzle",  logo: "https://cdn-icons-png.flaticon.com/512/2491/2491935.png", description: "Solve challenging word puzzles to boost vocabulary.", rating: 4.2, category: "puzzle, link: '/games'" },
    { id: "speed", title: "Speed Reading", logo: "https://cdn-icons-png.flaticon.com/512/2933/2933245.png", description: "Improve your reading speed and comprehension.", rating: 4.7, category: "brain, link: '/games'" },
    { id: "pattern", title: "Pattern Master",logo: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png", description: "Spot the patterns in this brain-teasing challenge.", rating: 4.3, category: "logic, link: '/games'" },
    { id: "emotion", title: "Emotion Match",  logo: "https://cdn-icons-png.flaticon.com/512/1906/1906429.png", description: "Match emotions to improve emotional intelligence.", rating: 4.6, category: "social" },
    { id: "focus", title: "Focus Trainer", logo: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png", description: "Enhance your concentration with this trainer.", rating: 4.4, category: "brain, link: '/games'" },
    { id: "math", title: "Math Blitz",  logo: "https://cdn-icons-png.flaticon.com/512/2105/2105983.png", description: "Quick math challenges to sharpen your skills.", rating: 4.8, category: "logic, link: '/games'" },
    { id: "typing", title: "Typing Fury",  logo: "https://cdn-icons-png.flaticon.com/512/3063/3063187.png", description: "Test and improve your typing speed.", rating: 4.1, category: "skill, link: '/games'" },
  ];

  useEffect(() => {
    const breathInterval = setInterval(() => setShowBreathPopup(true), 90000);
    return () => clearInterval(breathInterval);
  }, []);

  useEffect(() => {
    if (showBreathPopup) {
      const timer = setTimeout(() => setShowBreathPopup(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showBreathPopup]);

  useEffect(() => {
    if (user && !localStorage.getItem(`welcome_popup_${user.uid}`)) {
      setShowWelcomePopup(true);
      localStorage.setItem(`welcome_popup_${user.uid}`, 'true');
    }
  }, [user]);

  const handlePrevCourse = () => setCurrentCourse((prev) => (prev - 1 + featuredCourses.length) % featuredCourses.length);
  const handleNextCourse = () => setCurrentCourse((prev) => (prev + 1) % featuredCourses.length);
  const handlePrevGame = () => setCurrentGame((prev) => (prev - 1 + featuredGames.length) % featuredGames.length);
  const handleNextGame = () => setCurrentGame((prev) => (prev + 1) % featuredGames.length);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      await addDoc(collection(db, "contactMessages"), { email, message, timestamp: Timestamp.fromDate(new Date()) });
      setSubmitStatus("success");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
  const cardHover = { scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", transition: { duration: 0.3 } };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans overflow-hidden">
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-50" style={{ scaleX, transformOrigin: '0%' }} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full h-screen relative"
        >
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              src="https://my.spline.design/particleaibrain-c49e10404cb97e98391ff70697a5ce18/"
              frameBorder="0"
              className="w-full h-full absolute top-0 left-0 pointer-events-none"
              title="Spline Background"
              loading="lazy"
            />
          </div>
         
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-black bg-black-0 p-6 text-white z-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <SpeechText>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Explore Neurodiversity</h1>
              <p className="text-lg">Discover resources and games tailored for unique minds.</p>
            </SpeechText>
          </motion.div>
        </motion.section>

        {/* Content Sections - All with consistent container padding */}
        <div className="container mx-auto px-6 py-16 space-y-16">
          {/* About Section */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <motion.h2 
                className="text-3xl font-bold text-gray-800 mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <SpeechText>What is Neurodiversity?</SpeechText>
              </motion.h2>
              <motion.p 
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <SpeechText>
                  Neurodiversity celebrates the natural variations in human brain function and behavior,
                  recognizing conditions like ADHD, autism, and dyslexia as differences rather than deficits.
                </SpeechText>
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                <Link to="/about" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
                  <SpeechText>Learn More</SpeechText>
                </Link>
              </motion.div>
            </div>
            <motion.div
              className="relative "
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <img 
                src="https://enablingworld.com/wp-content/uploads/Capture-e1680341836190.png" 
                alt="Neurodiversity" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.section>

          {/* Features Grid */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-3xl font-bold text-center text-gray-800 mb-12"
              variants={itemVariants}
            >
              <SpeechText>Our Features</SpeechText>
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Brain, title: 'Brain Games', desc: 'Enhance cognitive abilities through fun challenges' },
                { icon: BookOpen, title: 'Courses', desc: 'Structured learning paths for all levels' },
                { icon: Users, title: 'Community', desc: 'Connect with others on similar journeys' },
                { icon: Activity, title: 'Tracking', desc: 'Monitor your progress and growth' },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  whileHover={cardHover}
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Featured Courses */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-between items-center mb-8">
              <motion.h2 
                className="text-3xl font-bold text-gray-800"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <SpeechText>Featured Courses</SpeechText>
              </motion.h2>
              <Link to="/courses" className="text-blue-600 hover:underline flex items-center">
                <SpeechText>View All</SpeechText> <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="overflow-hidden">
                <motion.div 
                  className="flex space-x-6"
                  animate={{ x: `-${currentCourse * 25}%` }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                >
                  {featuredCourses.map((course, index) => (
                    <motion.div
                      key={index}
                      className="flex-shrink-0 w-64"
                      whileHover={cardHover}
                    >
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
                        <div className="h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.title}</h3>
                        <div className="flex justify-between text-sm text-gray-500 mb-3">
                          <span>{course.level}</span>
                          <span>{course.duration}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <Link 
                          to={course.link} 
                          className="mt-auto text-blue-600 hover:underline flex items-center"
                        >
                          <SpeechText>Continue</SpeechText> <ArrowRight className="ml-1 w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              <button 
                onClick={handlePrevCourse}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={handleNextCourse}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-6 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </motion.section>

          {/* Featured Games */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-between items-center mb-8">
              <motion.h2 
                className="text-3xl font-bold text-gray-800"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <SpeechText>Featured Games</SpeechText>
              </motion.h2>
              <Link to="/games" className="text-blue-600 hover:underline flex items-center">
                <SpeechText>View All</SpeechText> <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="overflow-hidden">
                <motion.div 
                  className="flex space-x-6"
                  animate={{ x: `-${currentGame * 25}%` }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                >
                  {featuredGames.map((game, index) => (
                    <motion.div
                      key={index}
                      className="flex-shrink-0 w-64"
                      whileHover={cardHover}
                    >
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
                        <div className="h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                          <img src={game.logo} alt={game.title} className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{game.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span>{game.rating}</span>
                        </div>
                        <Link 
                          to={game.link} 
                          className="mt-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition-colors"
                        >
                          <SpeechText>Play Now</SpeechText>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              <button 
                onClick={handlePrevGame}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={handleNextGame}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-6 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </motion.section>

          {/* Stats Section */}
          
          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              <SpeechText>Ready to Get Started?</SpeechText>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              <SpeechText>
                Join thousands of users improving their cognitive skills through our platform.
              </SpeechText>
            </p>
          <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="px-8 py-3 bg-white-600 text-black rounded-lg font-medium shadow-lg"
>
  <Link to="/learning">
    <SpeechText>Start Now</SpeechText>
  </Link>
</motion.button>
          </motion.section>

          {/* Contact Section */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                <SpeechText>Contact Us</SpeechText>
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <SpeechText>Email</SpeechText>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <SpeechText>Message</SpeechText>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="How can we help you?"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-lg text-white font-medium ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  whileHover={{ scale: 1.02 }}
                >
                  <SpeechText>{isSubmitting ? 'Sending...' : 'Send Message'}</SpeechText>
                </motion.button>
              </form>
            </motion.div>
            
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl h-full">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">
                  <SpeechText>Contact Information</SpeechText>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-blue-600 mt-1 mr-4" />
                    <div>
                      <h4 className="font-medium text-gray-700">
                        <SpeechText>Email</SpeechText>
                      </h4>
                      <p className="text-gray-600">contact@neurogamehub.com</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-blue-600 mt-1 mr-4" />
                    <div>
                      <h4 className="font-medium text-gray-700">
                        <SpeechText>Phone</SpeechText>
                      </h4>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1 mr-4" />
                    <div>
                      <h4 className="font-medium text-gray-700">
                        <SpeechText>Address</SpeechText>
                      </h4>
                      <p className="text-gray-600">123 Gaming Street, Tech City</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </main>

   

      {/* Popups */}
      <AnimatePresence>
        {showWelcomePopup && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                <SpeechText>Welcome, {user.displayName || 'User'}!</SpeechText>
              </h2>
              <p className="text-gray-600 mb-6">
                <SpeechText>
                  We're excited to have you join our community of learners and gamers.
                </SpeechText>
              </p>
              <motion.button
                onClick={() => setShowWelcomePopup(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
              >
                <SpeechText>Get Started</SpeechText>
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {submitStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${submitStatus === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {submitStatus === 'success' ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h2 className={`text-2xl font-bold mb-4 ${submitStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                <SpeechText>{submitStatus === 'success' ? 'Message Sent!' : 'Error Sending Message'}</SpeechText>
              </h2>
              <p className="text-gray-600 mb-6">
                <SpeechText>
                  {submitStatus === 'success' 
                    ? 'We have received your message and will get back to you soon.' 
                    : 'There was an error sending your message. Please try again.'}
                </SpeechText>
              </p>
              <motion.button
                onClick={() => setSubmitStatus(null)}
                className={`px-6 py-2 rounded-lg font-medium ${submitStatus === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                whileHover={{ scale: 1.05 }}
              >
                <SpeechText>Close</SpeechText>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;