import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import { SocketProvider } from "./providers/SocketProvider";
import Room from "./pages/Room";

function App() {
  return (
    <Router>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </SocketProvider>
    </Router>
  );
}

export default App;
