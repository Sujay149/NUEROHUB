import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle, Clock, BookOpen, PlusCircle, Trash2, Edit2, Target, Star, Trophy, Flame, TrendingUp, ChevronDown } from 'lucide-react';
import { SpeechText } from '../components/speach'; // Fixed typo
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface Task {
  id: string;
  title: string;
  duration: string;
  type: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  reminderTime: string; // Now required
  reminderScheduled?: boolean;
}

const Daily: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Task>({
    id: '',
    title: '',
    duration: '',
    type: '',
    description: '',
    priority: 'Medium',
    reminderTime: '',
    reminderScheduled: false,
  });
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All'); // New filter for completion status
  const [editTask, setEditTask] = useState<Task | null>(null);
  const { user } = useAuth();
  const db = getFirestore();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setDailyTasks(data.dailyTasks || []);
        setCompletedTasks(data.completedTasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [user, db]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleTask = async (taskId: string) => {
    const updatedCompletedTasks = completedTasks.includes(taskId)
      ? completedTasks.filter(id => id !== taskId)
      : [...completedTasks, taskId];

    setCompletedTasks(updatedCompletedTasks);

    if (user) {
      await setDoc(
        doc(db, "users", user.uid),
        { completedTasks: updatedCompletedTasks },
        { merge: true }
      );
    }
  };

  const addTask = async () => {
    if (!newTask.title || !newTask.duration || !newTask.type || !newTask.reminderTime) return;

    const taskToAdd = { ...newTask, id: Date.now().toString() };
    const updatedTasks = [...dailyTasks, taskToAdd];
    setDailyTasks(updatedTasks);
    
    // Auto-schedule reminder since time is now mandatory
    scheduleTaskReminder(taskToAdd);
    
    resetNewTask();

    if (user) {
      await setDoc(
        doc(db, "users", user.uid),
        { dailyTasks: updatedTasks },
        { merge: true }
      );
    }
  };

  const updateTask = async () => {
    if (!editTask || !newTask.title || !newTask.duration || !newTask.type || !newTask.reminderTime) return;

    const updatedTasks = dailyTasks.map(task =>
      task.id === editTask.id ? { ...newTask, id: task.id } : task
    );
    setDailyTasks(updatedTasks);
    setEditTask(null);
    resetNewTask();

    if (user) {
      await setDoc(
        doc(db, "users", user.uid),
        { dailyTasks: updatedTasks },
        { merge: true }
      );
    }
  };

  const deleteTask = async (taskId: string) => {
    const updatedTasks = dailyTasks.filter(task => task.id !== taskId);
    setDailyTasks(updatedTasks);

    if (user) {
      await setDoc(
        doc(db, "users", user.uid),
        { dailyTasks: updatedTasks },
        { merge: true }
      );
    }
  };

  const resetNewTask = () => {
    setNewTask({
      id: '',
      title: '',
      duration: '',
      type: '',
      description: '',
      priority: 'Medium',
      reminderTime: '',
      reminderScheduled: false,
    });
  };

  const sendTaskReminder = useCallback(async (task: Task) => {
    try {
      const formData = new FormData();
      formData.append('access_key', '8b668786-3689-4838-9945-8123244ba831');
      formData.append('subject', `Task Reminder: ${task.title}`);
      formData.append('message', `
        🔔 Task Reminder Alert!
        
        Task: ${task.title}
        Description: ${task.description}
        Duration: ${task.duration}
        Type: ${task.type}
        Priority: ${task.priority}
        Scheduled Time: ${task.reminderTime}
        
        This is your scheduled reminder for the above task. Time to get productive!
        
        Best regards,
        NueroHub
      `);
      formData.append('from_name', 'Nuerohub Reminder');
      
      if (user?.email) {
        formData.append('email', user.email);
      }

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Task reminder sent successfully!');
      } else {
        throw new Error('Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending task reminder:', error);
      alert('Failed to send task reminder. Please try again.');
    }
  }, [user?.email]);

  const scheduleTaskReminder = async (task: Task) => {
    const reminderDateTime = new Date(`${new Date().toDateString()} ${task.reminderTime}`);
    const now = new Date();
    const timeUntilReminder = reminderDateTime.getTime() - now.getTime();

    if (timeUntilReminder <= 0) {
      alert('Please select a future time for the reminder!');
      return;
    }

    // Schedule the reminder
    setTimeout(() => {
      sendTaskReminder(task);
    }, timeUntilReminder);

    // Update task to mark reminder as scheduled
    const updatedTasks = dailyTasks.map(t =>
      t.id === task.id ? { ...t, reminderScheduled: true } : t
    );
    setDailyTasks(updatedTasks);

    if (user) {
      await setDoc(
        doc(db, "users", user.uid),
        { dailyTasks: updatedTasks },
        { merge: true }
      );
    }

    const timeString = reminderDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    alert(`Reminder scheduled for ${timeString}! You'll receive an email at the specified time.`);
  };

  // Re-schedule reminders when tasks are loaded
  useEffect(() => {
    dailyTasks.forEach(task => {
      if (!task.reminderScheduled && !completedTasks.includes(task.id)) {
        const reminderDateTime = new Date(`${new Date().toDateString()} ${task.reminderTime}`);
        const now = new Date();
        const timeUntilReminder = reminderDateTime.getTime() - now.getTime();
        
        if (timeUntilReminder > 0) {
          setTimeout(() => {
            sendTaskReminder(task);
          }, timeUntilReminder);
        }
      }
    });
  }, [dailyTasks, completedTasks, sendTaskReminder]);

  const filteredTasks = dailyTasks.filter(task => {
    // Filter by type
    const typeMatch = filterType === 'All' || task.type === filterType;
    
    // Filter by completion status
    const statusMatch = filterStatus === 'All' || 
      (filterStatus === 'Completed' && completedTasks.includes(task.id)) ||
      (filterStatus === 'Pending' && !completedTasks.includes(task.id));
    
    return typeMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-20 left-10 w-32 h-32 border-2 border-indigo-200 rounded-full opacity-30"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            y: [-10, 10, -10],
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-40 right-20 w-24 h-24 bg-blue-200 rounded-lg opacity-20"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-full"
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Enhanced Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="relative"
        >
          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Calendar className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <SpeechText>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      Daily Activities
                    </h1>
                  </SpeechText>
                  <SpeechText>
                    <p className="text-gray-600 font-medium">
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </SpeechText>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="flex flex-wrap gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-xl text-white shadow-lg"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6" />
                    <div>
                      <p className="text-sm opacity-90">Completed</p>
                      <p className="text-xl font-bold">{completedTasks.length}</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-xl text-white shadow-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Target className="w-6 h-6" />
                    <div>
                      <p className="text-sm opacity-90">Total Tasks</p>
                      <p className="text-xl font-bold">{dailyTasks.length}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-xl text-white shadow-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Flame className="w-6 h-6" />
                    <div>
                      <p className="text-sm opacity-90">Streak</p>
                      <p className="text-xl font-bold">{Math.min(completedTasks.length, 7)}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Filter Section */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                {/* Type Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Type:</label>
                  <div className="relative">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 pr-10 rounded-full font-medium bg-white/80 text-gray-700 border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none min-w-[120px]"
                    >
                      <option value="All">All</option>
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="Learning">Learning</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                
                {/* Status Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Status:</label>
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 pr-10 rounded-full font-medium bg-white/80 text-gray-700 border border-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all appearance-none min-w-[140px]"
                    >
                      <option value="All">📋 All</option>
                      <option value="Pending">⏳ Pending</option>
                      <option value="Completed">✅ Completed</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-3 flex items-center space-x-2"
              >
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">
                  {Math.round((completedTasks.length / Math.max(dailyTasks.length, 1)) * 100)}% Complete
                </span>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Enhanced Task List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <SpeechText>
                  <h2 className="text-2xl font-bold text-gray-800">Today's Tasks</h2>
                </SpeechText>
              </div>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {filteredTasks.length} of {dailyTasks.length} tasks
                {filterStatus !== 'All' && (
                  <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                    {filterStatus}
                  </span>
                )}
                {filterType !== 'All' && (
                  <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs">
                    {filterType}
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
              <AnimatePresence mode="popLayout">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.9 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 30, 
                      delay: index * 0.05 
                    }}
                    className={`relative group p-5 rounded-xl border-2 ${
                      completedTasks.includes(task.id)
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-green-100'
                        : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
                    } shadow-md overflow-hidden`}
                  >
                    {/* Priority indicator */}
                    <div className={`absolute left-0 top-0 w-1 h-full ${
                      task.priority === 'High' ? 'bg-red-500' :
                      task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />

                    {/* Task content */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              task.priority === 'High' ? 'bg-red-100 text-red-600' :
                              task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 
                              'bg-green-100 text-green-600'
                            }`}
                          >
                            {task.type === 'Work' ? '💼' : 
                             task.type === 'Personal' ? '🏠' : 
                             task.type === 'Learning' ? '📚' : '📋'}
                          </div>
                          <div className="flex-1">
                            <SpeechText>
                              <h3 className={`text-lg font-semibold mb-1 ${
                                completedTasks.includes(task.id) 
                                  ? 'text-green-700 line-through' 
                                  : 'text-gray-800'
                              }`}>
                                {task.title}
                              </h3>
                            </SpeechText>
                            <SpeechText>
                              <p className="text-gray-600 text-sm leading-relaxed">{task.description}</p>
                            </SpeechText>
                          </div>
                        </div>
                        
                        {/* Task meta info */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            <Clock className="w-4 h-4" />
                            <SpeechText><span>{task.duration}</span></SpeechText>
                          </div>
                          <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            <BookOpen className="w-4 h-4" />
                            <SpeechText><span>{task.type}</span></SpeechText>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'High' ? 'bg-red-200 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {task.priority} Priority
                          </div>
                          <div className="flex items-center space-x-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            <SpeechText><span>{task.reminderTime}</span></SpeechText>
                          </div>
                          {task.reminderScheduled && (
                            <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              <span>✓ Scheduled</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                    <div className="flex flex-row space-x-3">
  <button
    onClick={() => toggleTask(task.id)}
    className={`p-2 rounded-full shadow-md ${
      completedTasks.includes(task.id)
        ? 'bg-green-500 text-white'
        : 'bg-indigo-500 text-white'
    }`}
  >
    <CheckCircle className="w-5 h-5" />
  </button>

  <button
    onClick={() => {
      setEditTask(task);
      setNewTask(task);
    }}
    className="p-2 rounded-full bg-blue-500 text-white shadow-md"
  >
    <Edit2 className="w-4 h-4" />
  </button>

  <button
    onClick={() => deleteTask(task.id)}
    className="p-2 rounded-full bg-red-500 text-white shadow-md"
  >
    <Trash2 className="w-4 h-4" />
  </button>
</div>

                    </div>

                    {/* Completion badge */}
                    {completedTasks.includes(task.id) && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg"
                      >
                        ✨ Done!
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredTasks.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-gray-400" />
                  </div>
                  <SpeechText>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      {dailyTasks.length === 0 
                        ? 'No tasks found' 
                        : `No ${filterStatus.toLowerCase()} ${filterType !== 'All' ? filterType.toLowerCase() : ''} tasks found`}
                    </h3>
                  </SpeechText>
                  <SpeechText>
                    <p className="text-gray-500">
                      {dailyTasks.length === 0 
                        ? 'Add your first task to get started!' 
                        : filterStatus !== 'All' || filterType !== 'All' 
                          ? 'Try adjusting your filters or add a new task!'
                          : 'Add your first task to get started!'}
                    </p>
                  </SpeechText>
                  {(filterStatus !== 'All' || filterType !== 'All') && dailyTasks.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setFilterStatus('All');
                        setFilterType('All');
                      }}
                      className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all"
                    >
                      Clear Filters
                    </motion.button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Add/Edit Task Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center"
              >
                <PlusCircle className="w-5 h-5 text-white" />
              </motion.div>
              <SpeechText>
                <h2 className="text-2xl font-bold text-gray-800">
                  {editTask ? 'Edit Task' : 'Create New Task'}
                </h2>
              </SpeechText>
            </div>

            <div className="space-y-4">
              {/* Main form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  className="relative"
                >
                  <input
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-white/70 backdrop-blur-sm"
                    placeholder="Task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                  <label className="absolute -top-2 left-3 bg-white px-2 text-xs font-medium text-gray-600">
                    Title
                  </label>
                </motion.div>

                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  className="relative"
                >
                  <input
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-white/70 backdrop-blur-sm"
                    placeholder="e.g., 30 min, 2 hours..."
                    value={newTask.duration}
                    onChange={(e) => setNewTask({ ...newTask, duration: e.target.value })}
                  />
                  <label className="absolute -top-2 left-3 bg-white px-2 text-xs font-medium text-gray-600">
                    Duration
                  </label>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  className="relative"
                >
                  <select
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-white/70 backdrop-blur-sm appearance-none"
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                  >
                    <option value="">Select type...</option>
                    <option value="Work">💼 Work</option>
                    <option value="Personal">🏠 Personal</option>
                    <option value="Learning">📚 Learning</option>
                    <option value="Health">💪 Health</option>
                    <option value="Creative">🎨 Creative</option>
                  </select>
                  <label className="absolute -top-2 left-3 bg-white px-2 text-xs font-medium text-gray-600">
                    Category
                  </label>
                </motion.div>

                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  className="relative"
                >
                  <select
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-white/70 backdrop-blur-sm appearance-none"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                  >
                    <option value="Low">🟢 Low Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="High">🔴 High Priority</option>
                  </select>
                  <label className="absolute -top-2 left-3 bg-white px-2 text-xs font-medium text-gray-600">
                    Priority
                  </label>
                </motion.div>
              </div>

              <motion.div
                whileFocus={{ scale: 1.02 }}
                className="relative"
              >
                <textarea
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-white/70 backdrop-blur-sm resize-none"
                  placeholder="Describe your task in detail..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
                <label className="absolute -top-2 left-3 bg-white px-2 text-xs font-medium text-gray-600">
                  Description
                </label>
              </motion.div>

              {/* Reminder Time Input - Now Required */}
              <motion.div
                whileFocus={{ scale: 1.02 }}
                className="relative"
              >
                <input
                  type="time"
                  required
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-white/70 backdrop-blur-sm"
                  value={newTask.reminderTime}
                  onChange={(e) => setNewTask({ ...newTask, reminderTime: e.target.value })}
                />
                <label className="absolute -top-2 left-3 bg-white px-2 text-xs font-medium text-gray-600">
                  🔔 Reminder Time (Required) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 text-xs text-gray-500">
                  <span className="text-red-500 font-medium">Required:</span> Set a time to receive automatic email reminders for this task
                </div>
              </motion.div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={editTask ? updateTask : addTask}
                  className="flex-1 p-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                  <SpeechText>
                    <span>{editTask ? 'Update Task' : 'Add Task'}</span>
                  </SpeechText>
                </motion.button>

                {editTask && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditTask(null);
                      resetNewTask();
                    }}
                    className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        {/* Enhanced Progress Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
              >
                <TrendingUp className="w-5 h-5 text-white" />
              </motion.div>
              <SpeechText>
                <h2 className="text-2xl font-bold text-gray-800">Progress Tracker</h2>
              </SpeechText>
            </div>

            {/* Progress stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-xl text-white text-center"
              >
                <div className="text-2xl font-bold">{completedTasks.length}</div>
                <div className="text-sm opacity-90">Completed</div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-xl text-white text-center"
              >
                <div className="text-2xl font-bold">{dailyTasks.length - completedTasks.length}</div>
                <div className="text-sm opacity-90">Remaining</div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-xl text-white text-center"
              >
                <div className="text-2xl font-bold">
                  {Math.round((completedTasks.length / Math.max(dailyTasks.length, 1)) * 100)}%
                </div>
                <div className="text-sm opacity-90">Progress</div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-xl text-white text-center"
              >
                <div className="text-2xl font-bold">{Math.min(completedTasks.length, 7)}</div>
                <div className="text-sm opacity-90">Day Streak</div>
              </motion.div>
            </div>

            {/* Progress bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <SpeechText>
                  <span className="text-gray-700 font-medium">Daily Goal Progress</span>
                </SpeechText>
                <span className="text-sm text-gray-600">
                  {completedTasks.length} / {Math.max(dailyTasks.length, 5)} tasks
                </span>
              </div>
              
              <div className="relative">
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: `${(completedTasks.length / Math.max(dailyTasks.length, 1)) * 100}%` 
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  >
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>
                
                {/* Milestone markers */}
                <div className="absolute top-0 left-1/4 w-1 h-4 bg-yellow-400 rounded-full" />
                <div className="absolute top-0 left-1/2 w-1 h-4 bg-yellow-400 rounded-full" />
                <div className="absolute top-0 left-3/4 w-1 h-4 bg-yellow-400 rounded-full" />
              </div>
            </div>

            {/* Achievement notification */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Daily Goal: Complete {Math.min(5, dailyTasks.length)} tasks
              </div>
              {completedTasks.length >= Math.min(5, dailyTasks.length) && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Goal Achieved!</span>
                  <Star className="w-4 h-4" />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Completion Celebration */}
        <AnimatePresence>
          {completedTasks.length === dailyTasks.length && dailyTasks.length > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -50 }}
              transition={{ type: 'spring', stiffness: 150, damping: 15 }}
              className="relative overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 p-8 rounded-2xl shadow-2xl border border-green-300">
                {/* Celebration particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      animate={{
                        x: [0, Math.random() * 400 - 200],
                        y: [0, Math.random() * 300 - 150],
                        opacity: [1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 text-center">
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Trophy className="w-8 h-8 text-green-500" />
                  </motion.div>
                  
                  <SpeechText>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      🎉 Outstanding Achievement! 🎉
                    </h2>
                  </SpeechText>
                  
                  <SpeechText>
                    <p className="text-green-100 text-lg mb-4">
                      You've completed all your daily tasks! Time to celebrate your productivity!
                    </p>
                  </SpeechText>

                  <div className="flex flex-wrap justify-center gap-2 text-2xl">
                    <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 1, repeat: Infinity }}>🏆</motion.span>
                    <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>⭐</motion.span>
                    <motion.span animate={{ rotate: [0, -360] }} transition={{ duration: 1.2, repeat: Infinity }}>�</motion.span>
                    <motion.span animate={{ y: [-5, 5, -5] }} transition={{ duration: 0.6, repeat: Infinity }}>🎈</motion.span>
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>🥳</motion.span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Daily;