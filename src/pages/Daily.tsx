import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle, Clock, BookOpen, PlusCircle, Gift, Bell, Trash2, Edit2 } from 'lucide-react';
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
  });
  const [filterType, setFilterType] = useState<string>('All');
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
    if (!newTask.title || !newTask.duration || !newTask.type) return;

    const taskToAdd = { ...newTask, id: Date.now().toString() };
    const updatedTasks = [...dailyTasks, taskToAdd];
    setDailyTasks(updatedTasks);
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
    if (!editTask || !newTask.title || !newTask.duration || !newTask.type) return;

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
    });
  };

  const addReminderToGoogleCalendar = (task: Task) => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + parseDuration(task.duration));
    const event = {
      text: task.title,
      dates: `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      details: task.description,
      location: 'Your Schedule',
    };
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.text)}&dates=${event.dates}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}`;
    window.open(googleCalendarUrl, '_blank');
  };

  const parseDuration = (duration: string): number => {
    const [value, unit] = duration.split(' ');
    const numValue = parseInt(value) || 0;
    return unit?.toLowerCase().includes('h') ? numValue * 60 * 60 * 1000 : numValue * 60 * 1000;
  };

  const filteredTasks = filterType === 'All'
    ? dailyTasks
    : dailyTasks.filter(task => task.type === filterType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-lg"
        >
          <SpeechText>
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-2 sm:mb-0">Daily Activities</h1>
          </SpeechText>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <SpeechText>
                <span className="text-blue-500 text-sm sm:text-base font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </SpeechText>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-auto p-2 border rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            >
              <option value="All">All</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Learning">Learning</option>
            </select>
          </div>
        </motion.header>

        {/* Task List with Scroll Animation */}
        <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-200">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 mb-4 ${
                  completedTasks.includes(task.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-indigo-500 bg-indigo-50'
                } relative overflow-hidden`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between">
                  <div className="flex-1">
                    <SpeechText>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center flex-wrap">
                        {task.title}
                        <span className={`ml-2 px-2 py-1 text-xs font-bold rounded mt-1 sm:mt-0 ${
                          task.priority === 'Low'
                            ? 'bg-green-200 text-green-800'
                            : task.priority === 'Medium'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {task.priority}
                        </span>
                      </h3>
                      <p className="text-gray-700 text-sm sm:text-base mb-4">{task.description}</p>
                    </SpeechText>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-gray-600 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-1 text-blue-500" />
                        <SpeechText><span>{task.duration}</span></SpeechText>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-1 text-purple-500" />
                        <SpeechText><span>{task.type}</span></SpeechText>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4 sm:mt-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleTask(task.id)}
                      className={`p-2 rounded-full transition-colors ${
                        completedTasks.includes(task.id)
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-indigo-500 text-white hover:bg-indigo-600'
                      }`}
                    >
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => addReminderToGoogleCalendar(task)}
                      className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setEditTask(task);
                        setNewTask(task);
                      }}
                      className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                    >
                      <Edit2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.button>
                  </div>
                </div>
                {completedTasks.includes(task.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full"
                  >
                    Done!
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add/Edit Task Form */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 space-y-4"
        >
          <SpeechText>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {editTask ? 'Edit Task' : 'Add a New Task'}
            </h2>
          </SpeechText>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              placeholder="Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <input
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              placeholder="Duration (e.g., 30 min)"
              value={newTask.duration}
              onChange={(e) => setNewTask({ ...newTask, duration: e.target.value })}
            />
            <input
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              placeholder="Type"
              value={newTask.type}
              onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
            />
            <select
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
           
          </div>
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-4 text-sm sm:text-base"
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            rows={3}
          />
        </motion.div>
        <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={editTask ? updateTask : addTask}
              className="p-3 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-all text-sm sm:text-base"
            >
              <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              <SpeechText>
                <span>{editTask ? 'Update Task' : 'Add Task'}</span>
              </SpeechText>
            </motion.button>
        {/* Progress Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200"
        >
          <SpeechText>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Progress Tracker</h2>
          </SpeechText>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <SpeechText>
              <div className="text-gray-700 font-medium text-sm sm:text-base">
                Completed: {completedTasks.length} / {dailyTasks.length} tasks
              </div>
            </SpeechText>
            <div className="w-full sm:w-64 h-6 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${(completedTasks.length / Math.max(dailyTasks.length, 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 flex items-center flex-wrap">
            Daily Goal: Complete {Math.min(5, dailyTasks.length)} tasks
            {completedTasks.length >= Math.min(5, dailyTasks.length) && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-2 text-green-600 font-bold flex items-center mt-1 sm:mt-0"
              >
                Reward Unlocked! <Gift className="h-4 w-4 ml-1" />
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Completion Celebration */}
        {completedTasks.length === dailyTasks.length && dailyTasks.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 10 }}
            className="p-4 sm:p-6 bg-gradient-to-r from-green-200 to-green-400 border border-green-500 rounded-xl flex items-center space-x-4 shadow-lg"
          >
            <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-green-700 animate-pulse" />
            <SpeechText>
              <h2 className="text-lg sm:text-xl font-semibold text-green-900">
                Congratulations! All tasks completed! 🎉
              </h2>
            </SpeechText>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Daily;