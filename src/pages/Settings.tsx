import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Type, Eye, Bell, Lock, Moon, Sun, Volume2, Globe, Palette, Save, Mic } from 'lucide-react';

interface SettingsState {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
  notifications: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
  textToSpeech: boolean;
  language: 'en' | 'es' | 'fr' | 'de'; // Kept for UI, but not tied to translations
  profileVisibility: 'public' | 'private' | 'friends';
  primaryColor: string;
}

const Settings = () => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      theme: 'light',
      fontSize: 'medium',
      reduceMotion: false,
      notifications: true,
      highContrast: false,
      soundEnabled: true,
      textToSpeech: false,
      language: 'en',
      profileVisibility: 'public',
      primaryColor: '#4F46E5', // Default indigo
    };
  });

  useEffect(() => {
    const root = document.documentElement;

    // Apply theme
    if (settings.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('light');
    }

    // Apply font size
    root.style.fontSize = settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px';

    // Apply high contrast
    root.style.filter = settings.highContrast ? 'contrast(1.5)' : 'none';

    // Apply reduce motion
    root.style.setProperty('--animate-duration', settings.reduceMotion ? '0s' : '0.3s');

    // Apply primary color
    root.style.setProperty('--primary-color', settings.primaryColor);
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('settings', JSON.stringify(settings));
    if (settings.soundEnabled) {
      new Audio('https://www.soundjay.com/buttons/beep-01a.mp3').play().catch(() => {});
    }
    if (settings.textToSpeech) {
      const utterance = new SpeechSynthesisUtterance('Settings saved!');
      utterance.lang = settings.language; // Still uses selected language for speech
      speechSynthesis.speak(utterance);
    }
    alert('Settings saved!');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8 bg-gradient-to-br from-gray-100 to-gray-200 light:from-gray-900 light:to-light-800 min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-extrabold text-gray-900 light:text-black tracking-tight"
      >
        Settings
      </motion.h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Display Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white light:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 light:border-gray-700 hover:shadow-xl transition-shadow"
        >
          <h2 className="text-2xl font-semibold text-gray-800 light:text-white mb-6 flex items-center">
            <Palette className="h-6 w-6 mr-2 text-indigo-600 light:text-indigo-400" />
            Display Preferences
          </h2>
          <div className="space-y-6">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {settings.theme === 'light' ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-400" />
                )}
                <div>
                  <p className="font-medium text-gray-800 light:text-white">Theme</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">light or light mode</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.theme === 'light'}
                  onChange={(e) => updateSetting('theme', e.target.checked ? 'light' : 'light')}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 light:peer-focus:ring-indigo-700 transition-colors">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 peer-checked:translate-x-6 transition-transform"></div>
                </div>
              </label>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Type className="h-5 w-5 text-indigo-600 light:text-indigo-400" />
                <div>
                  <p className="font-medium text-gray-800 light:text-white">Font Size</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">Adjust text size</p>
                </div>
              </div>
              <select
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', e.target.value as 'small' | 'medium' | 'large')}
                className="px-3 py-2 bg-gray-50 light:bg-gray-700 border border-gray-300 light:border-gray-600 rounded-lg text-gray-800 light:text-white focus:ring-2 focus:ring-indigo-500 light:focus:ring-indigo-600 transition-all"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-indigo-600 light:text-indigo-400" />
                <div>
                  <p className="font-medium text-gray-800 light:text-white">Reduce Motion</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">Minimize animations</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 light:peer-focus:ring-indigo-700 transition-colors">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 peer-checked:translate-x-6 transition-transform"></div>
                </div>
              </label>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Palette className="h-5 w-5 text-indigo-600 light:text-indigo-400" />
                <div>
                  <p className="font-medium text-gray-800 light:text-white">High Contrast</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">Enhance visibility</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => updateSetting('highContrast', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 light:peer-focus:ring-indigo-700 transition-colors">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 peer-checked:translate-x-6 transition-transform"></div>
                </div>
              </label>
            </div>

            {/* Primary Color */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Palette className="h-5 w-5 text-indigo-600 light:text-indigo-400" />
                <div>
                  <p className="font-medium text-gray-800 light:text-white">Primary Color</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">Customize accent color</p>
                </div>
              </div>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => updateSetting('primaryColor', e.target.value)}
                className="w-12 h-8 rounded-md border border-gray-300 light:border-gray-600 cursor-pointer"
              />
            </div>
          </div>
        </motion.div>

        {/* Notifications & Accessibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          transition={{ delay: 0.1 }}
          className="bg-white light:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 light:border-gray-700 hover:shadow-xl transition-shadow"
        >
          <h2 className="text-2xl font-semibold text-gray-800 light:text-white mb-6 flex items-center">
            <Bell className="h-6 w-6 mr-2 text-indigo-600 light:text-indigo-400" />
            Notifications & Accessibility
          </h2>
          <div className="space-y-6">
            {/* Daily Reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-indigo-600 light:text-indigo-400" />
                <div>
                  <p className="font-medium text-gray-800 light:text-white">Daily Reminders</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">Activity notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => updateSetting('notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 light:peer-focus:ring-indigo-700 transition-colors">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 peer-checked:translate-x-6 transition-transform"></div>
                </div>
              </label>
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="h-5 w-5 text-indigo-600 light:text-indigo-400" />
                <div>
                  <p className="font-medium text-gray-800 light:text-white">Sound Effects</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">Notification sounds</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 light:peer-focus:ring-indigo-700 transition-colors">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 peer-checked:translate-x-6 transition-transform"></div>
                </div>
              </label>
            </div>

            {/* Text-to-Speech */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mic className="h-5 w-5 text-indigo-600 light:text-indigo-400" />
                <div>
                  <p className="font-medium textvento-gray-800 light:text-white">Text-to-Speech</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">Enable audio for text</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.textToSpeech}
                  onChange={(e) => updateSetting('textToSpeech', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 light:peer-focus:ring-indigo-700 transition-colors">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.ера5 peer-checked:translate-x-6 transition-transform"></div>
                </div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Privacy & Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          transition={{ delay: 0.2 }}
          className="bg-white light:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 light:border-gray-700 hover:shadow-xl transition-shadow sm:col-span-2"
        >
          <h2 className="text-2xl font-semibold text-gray-800 light:text-white mb-6 flex items-center">
            <Lock className="h-6 w-6 mr-2 text-indigo-600 light:text-indigo-400" />
            Privacy & Language
          </h2>
          <div className="space-y-6">
            {/* Profile Visibility */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="h-5 w-5 text-indigo-600 light:text-indigo-400" />
                <div>
                  <p className="font-medium text-gray-800 light:text-white">Profile Visibility</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">Who can see your profile</p>
                </div>
              </div>
              <select
                value={settings.profileVisibility}
                onChange={(e) => updateSetting('profileVisibility', e.target.value as 'public' | 'private' | 'friends')}
                className="px-3 py-2 bg-gray-50 light:bg-gray-700 border border-gray-300 light:border-gray-600 rounded-lg text-gray-800 light:text-white focus:ring-2 focus:ring-indigo-500 light:focus:ring-indigo-600 transition-all"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-indigo-600 light:text-indigo-400" />
                <div>
                  <p className="font-medium text-gray-800 light:text-white">Language</p>
                  <p className="text-sm text-gray-600 light:text-gray-400">Preferred language</p>
                </div>
              </div>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value as 'en' | 'es' | 'fr' | 'de')}
                className="px-3 py-2 bg-gray-50 light:bg-gray-700 border border-gray-300 light:border-gray-600 rounded-lg text-gray-800 light:text-white focus:ring-2 focus:ring-indigo-500 light:focus:ring-indigo-600 transition-all"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end"
      >
        <button
          onClick={saveSettings}
          className="flex items-center px-6 py-3 text-white rounded-lg hover:bg-opacity-90 focus:ring-4 focus:ring-indigo-300 light:focus:ring-indigo-700 transition-all"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <Save className="h-5 w-5 mr-2" />
          Save Settings
        </button>
      </motion.div>
    </div>
  );
};

export default Settings;