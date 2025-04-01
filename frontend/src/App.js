import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatRoomPage from './pages/ChatRoomPage';
import axios from "axios";
import { useEffect, useState } from "react";


function App() {
  /* Get current user at start up */

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    axios.get("users/api/me/")
    .then((response) => {
      setCurrentUser(response.data);
    })
    .catch((error) => {
      console.error("Not logged in", error)
    });
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <Routes>
          <Route path="/chat/:roomId" element={<ChatRoomPage />} />
          <Route path="*" element={<div className="chat-window">Select a chat</div>} />
        </Routes>
        <div className="room-info">Room Info</div>
      </div>
    </Router>
  );
}

export default App;
