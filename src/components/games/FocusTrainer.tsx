import React, { useState, useEffect } from 'react';

const FocusTrainer = () => {
  const [number, setNumber] = useState(Math.floor(Math.random() * 100));
  const [userInput, setUserInput] = useState('');
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    if (parseInt(userInput) === number) {
      setMessage('Correct! 🎯');
    } else {
      setMessage('Try again! ❌');
    }
    setUserInput('');
    setNumber(Math.floor(Math.random() * 100));
    setTimer(5);
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Focus Trainer</h2>
      <p>Memorize this number: <strong className="text-blue-600">{number}</strong></p>
      <p className="text-gray-600">You have {timer} seconds.</p>
      {timer === 0 && (
        <>
          <input 
            type="number"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="border p-2 rounded w-full mt-4"
          />
          <button onClick={handleSubmit} className="mt-2 p-2 bg-blue-500 text-white rounded">Submit</button>
          <p className="mt-2">{message}</p>
        </>
      )}
    </div>
  );
};

export default FocusTrainer;
