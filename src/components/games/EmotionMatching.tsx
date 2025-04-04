import React, { useState, useEffect } from 'react';

const emotions = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '😨', label: 'Scared' }
];

const EmotionMatching = () => {
  const [targetEmotion, setTargetEmotion] = useState<{ emoji: string; label: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);

  // Generate a random emotion at the start
  useEffect(() => {
    generateRandomEmotion();
  }, []);

  const generateRandomEmotion = () => {
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    setTargetEmotion(randomEmotion);
    setSelected(null);
    setMessage('');
  };

  const handleSelect = (label: string) => {
    if (targetEmotion && label === targetEmotion.label) {
      setMessage('✅ Correct! Well done! 🎉');
      setScore(score + 1);
    } else {
      setMessage('❌ Try again! 😕');
    }
    setSelected(label);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg w-96 text-center">
      <h2 className="text-xl font-bold mb-4">Emotion Matching</h2>
      {targetEmotion && (
        <>
          <p className="text-lg font-medium mb-2">Which emotion is this?</p>
          <p className="text-5xl">{targetEmotion.emoji}</p>

          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {emotions.map(({ emoji, label }) => (
              <button
                key={label}
                onClick={() => handleSelect(label)}
                className={`p-3 px-4 text-lg font-medium rounded-lg transition-all ${
                  selected === label
                    ? label === targetEmotion.label
                      ? 'bg-green-400 text-white'
                      : 'bg-red-400 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>

          <p className="mt-4 font-bold text-lg">{message}</p>
          <p className="mt-2 text-gray-600">Score: {score}</p>

          <button
            onClick={generateRandomEmotion}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all"
          >
            New Emotion 🔄
          </button>
        </>
      )}
    </div>
  );
};

export default EmotionMatching;
