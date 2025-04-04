/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MemoryMatch from "../components/games/MemoryMatch";
import WordPuzzle from "../components/games/WordPuzzle";
import SpeedReading from "../components/games/SpeedReading";
import PatternRecognition from "../components/games/PatternRecognition";
import EmotionMatching from "../components/games/EmotionMatching";
import FocusTrainer from "../components/games/FocusTrainer";
import { Gamepad2, X, Play, Star, Trophy, Home, User, LogIn, LogOut, Settings } from "lucide-react";
import { SpeechText } from "../components/speach";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from "firebase/firestore";
import { useAuth } from "./AuthContext";

interface Game {
  id: string;
  title: string;
  component: React.FC<{ onGameComplete: (score: number) => void }>;
  logo: string;
  description: string;
  rating: number;
  category: string;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  gameId: string;
  timestamp: string;
}

const GamesPage: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { user, logout } = useAuth();
  const db = getFirestore();

  const games: Game[] = [
    { id: "memory", title: "Memory Match", component: MemoryMatch, logo: "https://cdn-icons-png.flaticon.com/512/808/808439.png", description: "Test your memory with this fun card-matching game!", rating: 4.5, category: "memory" },
    { id: "word", title: "Word Puzzle", component: WordPuzzle, logo: "https://cdn-icons-png.flaticon.com/512/2491/2491935.png", description: "Solve challenging word puzzles to boost vocabulary.", rating: 4.2, category: "puzzle" },
    { id: "speed", title: "Speed Reading", component: SpeedReading, logo: "https://cdn-icons-png.flaticon.com/512/2933/2933245.png", description: "Improve your reading speed and comprehension.", rating: 4.7, category: "brain" },
    { id: "pattern", title: "Pattern Master", component: PatternRecognition, logo: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png", description: "Spot the patterns in this brain-teasing challenge.", rating: 4.3, category: "logic" },
    { id: "emotion", title: "Emotion Match", component: EmotionMatching, logo: "https://cdn-icons-png.flaticon.com/512/1906/1906429.png", description: "Match emotions to improve emotional intelligence.", rating: 4.6, category: "social" },
    { id: "focus", title: "Focus Trainer", component: FocusTrainer, logo: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png", description: "Enhance your concentration with this trainer.", rating: 4.4, category: "brain" },
    { id: "math", title: "Math Blitz", component: FocusTrainer, logo: "https://cdn-icons-png.flaticon.com/512/2105/2105983.png", description: "Quick math challenges to sharpen your skills.", rating: 4.8, category: "logic" },
    { id: "typing", title: "Typing Fury", component: FocusTrainer, logo: "https://cdn-icons-png.flaticon.com/512/3063/3063187.png", description: "Test and improve your typing speed.", rating: 4.1, category: "skill" },
  ];

  const categories = [
    { id: "all", name: "All Games" },
    { id: "memory", name: "Memory" },
    { id: "puzzle", name: "Puzzle" },
    { id: "brain", name: "Brain Training" },
    { id: "logic", name: "Logic" },
    { id: "skill", name: "Skill" },
  ];

  const filteredGames = activeCategory === "all" 
    ? games 
    : games.filter(game => game.category === activeCategory);

  const selectedGame = games.find((game) => game.id === activeGame);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        let q;
        if (activeGame) {
          q = query(
            collection(db, "leaderboard"),
            where("gameId", "==", activeGame),
            orderBy("score", "desc"),
            limit(10)
          );
        } else {
          q = query(
            collection(db, "leaderboard"),
            orderBy("score", "desc"),
            limit(10)
          );
        }
        
        const querySnapshot = await getDocs(q);
        const leaderboardData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            userId: data.userId,
            displayName: data.displayName || "Anonymous",
            score: data.score,
            gameId: data.gameId,
            timestamp: data.timestamp instanceof Timestamp 
              ? data.timestamp.toDate().toLocaleString() 
              : new Date(data.timestamp).toLocaleString(),
          } as LeaderboardEntry;
        });
        
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setLeaderboard([]);
      }
    };

    fetchLeaderboard();
  }, [db, activeGame]);

  const handleGameComplete = async (score: number) => {
    if (!user) {
      alert("Please log in to submit your score!");
      return;
    }
    if (!activeGame) {
      console.error("No active game selected");
      alert("No game selected!");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "leaderboard"), {
        userId: user.uid,
        displayName: user.displayName || "Anonymous",
        score,
        gameId: activeGame,
        timestamp: Timestamp.fromDate(new Date()),
      });
      
      // Refetch leaderboard
      const q = query(
        collection(db, "leaderboard"),
        where("gameId", "==", activeGame),
        orderBy("score", "desc"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const leaderboardData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          userId: data.userId,
          displayName: data.displayName,
          score: data.score,
          gameId: data.gameId,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate().toLocaleString() 
            : new Date(data.timestamp).toLocaleString(),
        } as LeaderboardEntry;
      });
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error submitting score:", error);
      alert(`Failed to submit score: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
    

      {/* Hero section with clean white background */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
              <SpeechText>Boost Your Cognitive Skills</SpeechText>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              <SpeechText>
                Challenge yourself with our collection of brain-training games. Improve memory, focus, and problem-solving skills while having fun!
              </SpeechText>
            </p>
            {!user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-all"
              >
                <SpeechText>Sign Up to Track Progress</SpeechText>
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Game categories */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeCategory === category.id 
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main game grid */}
      <main className="container mx-auto px-4 pb-12 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <motion.div
              key={game.id}
              onHoverStart={() => setHoveredGame(game.id)}
              onHoverEnd={() => setHoveredGame(null)}
              className="relative bg-white rounded-lg overflow-hidden shadow-md cursor-pointer group border border-gray-200 hover:border-blue-300 transition-all"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative h-48 bg-gray-100">
                <img
                  src={game.logo}
                  alt={`${game.title} Logo`}
                  className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 bg-white/90 rounded-full px-2 py-1 flex items-center text-yellow-500 text-sm shadow-sm">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {game.rating}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  <SpeechText>{game.title}</SpeechText>
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  <SpeechText>{game.description}</SpeechText>
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                    {categories.find(c => c.id === game.category)?.name}
                  </span>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveGame(game.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center space-x-1 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4" />
                    <span>Play</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Game modal */}
      <AnimatePresence>
        {activeGame && selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative overflow-hidden border border-gray-200"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setActiveGame(null)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6 mb-6">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center p-2 border border-gray-200">
                    <img src={selectedGame.logo} alt={selectedGame.title} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      <SpeechText>{selectedGame.title}</SpeechText>
                    </h2>
                    <p className="text-gray-600 mb-2">
                      <SpeechText>{selectedGame.description}</SpeechText>
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 fill-current mr-1" />
                        <span>{selectedGame.rating}</span>
                      </div>
                      <span className="text-gray-400">|</span>
                      <span className="text-blue-600">
                        {categories.find(c => c.id === selectedGame.category)?.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[70vh] overflow-y-auto">
                  {React.createElement(selectedGame.component, { onGameComplete: handleGameComplete })}
                </div>
                
                {user && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleGameComplete(Math.floor(Math.random() * 100) + 50)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-all"
                    >
                      Submit Test Score (Random 50-149)
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden border border-gray-200"
            >
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                    <SpeechText>
                      {activeGame 
                        ? `${games.find(g => g.id === activeGame)?.title} Leaderboard`
                        : "Global Leaderboard"}
                    </SpeechText>
                  </h3>
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry, index) => (
                      <motion.div
                        key={`${entry.userId}-${entry.gameId}-${entry.timestamp}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center p-3 rounded-lg ${
                          user && entry.userId === user.uid 
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-white hover:bg-gray-50 border border-gray-100'
                        } transition-colors`}
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mr-3 text-sm font-bold text-gray-700">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {entry.displayName}
                            {user && entry.userId === user.uid && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">You</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {games.find(g => g.id === entry.gameId)?.title || "Unknown Game"}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-blue-600 font-bold">{entry.score}</p>
                          <p className="text-xs text-gray-400">{entry.timestamp}</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <Trophy className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>No scores yet. Be the first to play!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Gamepad2 className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-gray-800">BrainGame Hub</span>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">About</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Contact</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">Terms</a>
            </div>
          </div>
          
          <div className="mt-4 text-center md:text-left text-sm text-gray-500">
            © 2025 BrainGame Hub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GamesPage;