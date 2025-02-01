
import './App.css'

function App() {
  
// Handle box click
const handleClick = (text: string) => {
  alert(`You clicked: ${text}`);
};

return (
  <div className="container">
    <div className="box" onClick={() => handleClick("Box 1")}>Box 1</div>
    <div className="box" onClick={() => handleClick("Box 2")}>Box 2</div>
    <div className="box" onClick={() => handleClick("Box 3")}>Box 3</div>
    <div className="box" onClick={() => handleClick("Box 4")}>Box 4</div>
  </div>
);

}

export default App
