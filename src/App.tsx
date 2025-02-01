import './App.css'
import { useState, useEffect } from "react";

function App() {
  const [promptState, setPromptState] = useState("fullscreen"); // "fullscreen" → "top"
  const [showButtons, setShowButtons] = useState(false);
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10); // Countdown starts at 10

  useEffect(() => {
    // Shrink the prompt after 3 seconds
    setTimeout(() => {
      setPromptState("top");
    }, 3000);

    // Show buttons after the prompt animation completes
    setTimeout(() => {
      setShowButtons(true);
    }, 4000);

    // Show timer after buttons appear and start countdown
    setTimeout(() => {
      setShowTimer(true);
      startCountdown();
    }, 5000);
  }, []);

  // Start countdown function
  const startCountdown = () => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 0) return prev - 1;
        clearInterval(timer);
        return 0;
      });
    }, 1000);
  };

  // Calculate color transition from green to red
  const getTimerColor = () => {
    const ratio = timeLeft / 10;
    const red = Math.round(255 * (1 - ratio));
    const green = Math.round(255 * ratio);
    return `rgb(${red}, ${green}, 0)`; // Smoothly transitions from green → red
  };

  // Handle button click
  const handleClick = (buttonId: string) => {
    setSelectedButton(buttonId);
  };

  return (
    <div className="container">
      {/* Animated Prompt */}
      <div className={`prompt ${promptState}`}>This is your prompt</div>

      {/* Button grid appears at the bottom half */}
      {showButtons && (
        <div className="button-grid">
          {["Button 1", "Button 2", "Button 3", "Button 4"].map((btn) => (
            <button
              key={btn}
              className={`button ${selectedButton === btn ? "selected" : selectedButton ? "faded" : ""}`}
              onClick={() => handleClick(btn)}
              disabled={selectedButton !== null} // Disable all buttons after selection
            >
              {btn}
            </button>
          ))}
        </div>
      )}

      {/* Timer appears after buttons */}
      {showTimer && (
        <div className="timer">
          <svg className="timer-circle" viewBox="0 0 100 100">
            {/* Outline Circle */}
            <circle cx="50" cy="50" r="40" className="timer-background" />
            {/* Progress Circle (only outline, no fill) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className="timer-progress"
              strokeDasharray="251.2"
              strokeDashoffset={`${(timeLeft / 10) * 251.2}`}
              style={{ stroke: getTimerColor(), fill: "none" }} // Outline only
            />
            {/* Countdown Number */}
            <text x="50" y="55" textAnchor="middle" className="timer-text">
              {timeLeft}
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
export default App