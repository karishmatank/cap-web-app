import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import RoomInfoSidebar from './components/RoomInfoSidebar';
import ChatRoomPage from './pages/ChatRoomPage';
import Navbar from './components/Navbar';
import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie } from './utils/csrf';

function Layout() {
  /* Get current user at start up */

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    axios.get("/users/api/me/")
    .then((response) => {
      setCurrentUser(response.data);
    })
    .catch((error) => {
      console.error("Not logged in", error)
    });
  }, []);

  /* Match current route against /chat/:roomId to get the roomId */
  const location = useLocation();
  const match = matchPath("/chat/:roomId", location.pathname);
  const roomId = match?.params?.roomId;

  /* Get a refreshed list of chat rooms */

  // We will store rooms in an empty list
  const [rooms, setRooms] = useState([]);

  // When the empty list renders upon loading, we'll populate it with a list of chat rooms that the user is a part of
  const fetchChatRooms = () => {
    axios.get("/chat/api/chats/")
    .then((response) => {
        setRooms(response.data);
    })
    .catch((error) => {
        console.error("Error fetching rooms", error);
    });
  }

  useEffect(() => {
    fetchChatRooms();
  }, []);

  /* New chat */
  const navigate = useNavigate();

  const newChat = () => {
    axios.post("/chat/api/chats/create/", {}, {
        headers: {
            "X-CSRFToken": getCookie("csrftoken"),
        },
    })
    .then((response) => {
        const newRoomId = response.data.id;
        fetchChatRooms();
        navigate(`/chat/${newRoomId}`);
    })
    .catch((error) => {
        console.error("Error creating new room", error);
    });
  };
  

  return (
    <div className="main-wrapper">
      <Navbar />
      <div className="app-container">
        <Sidebar rooms={rooms} newChat={newChat} />
        <Routes>
          <Route path="/chat/:roomId" element={<ChatRoomPage currentUser={currentUser} refreshRooms={fetchChatRooms} />} />
          <Route path="*" element={<div className="chat-window no-chat-selected">Select a chat</div>} />
        </Routes>
        <RoomInfoSidebar roomId={roomId} refreshRooms={fetchChatRooms} />
      </div>
    </div>
  );
}

function App() {
  
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
