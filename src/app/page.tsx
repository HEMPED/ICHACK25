"use client"

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleCreateGame = () => {
    router.push('/game'); // Change to your target page
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-96">
        <h1 className="text-2xl font-bold text-center mb-4">Welcome</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Game Code"
            className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="w-full p-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold">
            Join Game
          </button>
          <div className="flex items-center justify-center">
            <span className="text-gray-400">or</span>
          </div>
          <button className="w-full p-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
            onClick={handleCreateGame}
          >
            Create Game
          </button>
        </div>
      </div>
    </div>
  );
}
