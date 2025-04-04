import React, { useState } from 'react';

const PatternRecognition = () => {
  const [pattern, setPattern] = useState(['⭐', '🌙', '☀️', '💧']);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);

  const handleInput = (symbol: string) => {
    const newInput = [...userInput, symbol];
    setUserInput(newInput);

    if (newInput.length === pattern.length) {
      if (JSON.stringify(newInput) === JSON.stringify(pattern)) {
        setMessage('Well Done! ✅');
        setScore(score + 1);
        // Generate new random pattern
        const symbols = ['⭐', '🌙', '☀️', '💧', '🌟', '⚡'];
        const newPattern = Array(4).fill(null).map(() => 
          symbols[Math.floor(Math.random() * symbols.length)]
        );
        setPattern(newPattern);
      } else {
        setMessage('Incorrect! Try Again 🔄');
      }
      setUserInput([]);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-100 to-blue-100 shadow-lg rounded-xl max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-purple-800">Cosmic Pattern Challenge</h2>
      <div className="flex justify-between mb-4">
        <p className="text-gray-700">Match the celestial sequence!</p>
        <p className="font-semibold">Score: {score}</p>
      </div>
      
      {/* Pattern Display */}
      <div className="flex justify-center gap-3 my-6 text-3xl bg-white p-3 rounded-lg shadow-inner">
        {pattern.map((symbol, idx) => (
          <span 
            key={idx}
            className="transform hover:scale-110 transition-transform duration-200"
          >
            {symbol}
          </span>
        ))}
      </div>

      {/* Input Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {['⭐', '🌙', '☀️', '💧', '🌟', '⚡'].map((symbol) => (
          <button
            key={symbol}
            onClick={() => handleInput(symbol)}
            className="p-3 bg-white rounded-lg shadow-md hover:bg-gray-100 active:scale-95 transition-all duration-150 text-2xl"
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* User Input Display */}
      <div className="flex justify-center gap-2 min-h-[2rem] mb-4">
        {userInput.map((symbol, idx) => (
          <span key={idx} className="text-2xl animate-pulse">{symbol}</span>
        ))}
      </div>

      {/* Message */}
      <p className="text-center text-lg font-semibold text-purple-700">{message}</p>
    </div>
  );
};

export default PatternRecognition; 