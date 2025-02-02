"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Game() {
  const router = useRouter();

  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (userInput.trim() !== '') {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 bg-gray-900 text-white">
      {!submitted ? (
        <div className="flex flex-col items-center space-y-4">
          <div 
            className="text-2xl font-bold text-gray-200 text-center w-full max-w-xl"
          >
            This is the Prompt <span className="underline">{userInput}</span>
          </div>
          <input
            type="text"
            className="p-3 rounded-lg text-black w-64"
            placeholder="Continue the prompt..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            autoFocus
          />
          <button 
            className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-start h-screen p-4">
          <div className="text-2xl font-bold mt-6 text-gray-200 text-center w-full max-w-xl">
            This is the Prompt <span className="underline">{userInput}</span>
          </div>
          <div className="grid grid-cols-2 gap-24 mt-auto mb-20 w-full max-w-2xl">
            <button className="bg-blue-500 text-white font-semibold py-8 px-12 text-xl rounded-lg shadow-md hover:bg-blue-600 transition">{userInput}</button>
            <button className="bg-green-500 text-white font-semibold py-8 px-12 text-xl rounded-lg shadow-md hover:bg-green-600 transition">Button 2</button>
            <button className="bg-red-500 text-white font-semibold py-8 px-12 text-xl rounded-lg shadow-md hover:bg-red-600 transition">Button 3</button>
            <button className="bg-yellow-500 text-white font-semibold py-8 px-12 text-xl rounded-lg shadow-md hover:bg-yellow-600 transition">Button 4</button>
          </div>
        </div>
      )}
    </div>
  );
}
