"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Game() {
  const [userInput, setUserInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [buttonText, setButtonText] = useState('');
  const router = useRouter();

  const buttons = [
    { text: buttonText || "Button 1", color: "bg-blue-500 hover:bg-blue-600" },
    { text: "Button 2", color: "bg-green-500 hover:bg-green-600" },
    { text: "Button 3", color: "bg-red-500 hover:bg-red-600" },
    { text: "Button 4", color: "bg-yellow-500 hover:bg-yellow-600" }
  ];

  const handleSubmit = () => {
    if (userInput.trim() !== '') {
      setButtonText(userInput);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 bg-gray-900 text-white">
      {!submitted ? (
        <div className="flex flex-col items-center space-y-4">
          <div 
            className="text-4xl font-bold text-gray-200 text-center w-full max-w-xl mt-[-50px]"
          >
            Generated Prompt
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
            className="bg-blue-500 text-white font-semibold py-2 px-24 rounded-lg hover:bg-blue-600 transition"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <div className="text-4xl font-bold text-gray-200 text-center w-full max-w-xl mb-16 mt-[-50px]">
            Generated Prompt
          </div>
          <div className="flex justify-center flex-wrap gap-6 w-full max-w-4xl">
            {buttons.map((button, index) => (
              <button 
                key={index} 
                className={`${button.color} text-white font-semibold py-8 px-12 text-xl rounded-lg shadow-md transition flex-1 min-w-[150px] text-center`}
              >
                {button.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
