import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath, useNavigate, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import RoomInfoSidebar from './components/RoomInfoSidebar';
import ChatRoomPage from './pages/ChatRoomPage';
import Navbar from './components/Navbar';
import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie } from './utils/csrf';
import navLinks from './utils/navLinks';

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

  /* Listen for when Bootstrap finishes hiding the offcanvas and clean up the leftover backdrop
  For when users tap off the backdrop in mobile view */
  useEffect(() => {
    const sidebarEl = document.getElementById("sidebarOffcanvas");
    const infoEl = document.getElementById("infoOffcanvas");
    const mobileEl = document.getElementById("mobileNavBarOffcanvas")

    const handleClose = () => {
      // Remove leftover backdrop if Bootstrap doesn't
      document.body.classList.remove("offcanvas-backdrop");
      const backdrop = document.querySelector(".offcanvas-backdrop");
      if (backdrop) backdrop.remove();
    };

    sidebarEl?.addEventListener("hidden.bs.offcanvas", handleClose);
    infoEl?.addEventListener("hidden.bs.offcanvas", handleClose);
    mobileEl?.addEventListener("hidden.bs.offcanvas", handleClose);

    return () => {
      sidebarEl?.removeEventListener("hidden.bs.offcanvas", handleClose);
      infoEl?.removeEventListener("hidden.bs.offcanvas", handleClose);
      mobileEl?.removeEventListener("hidden.bs.offcanvas", handleClose);
    };

  }, []);
  

  return (
    <div className="main-wrapper">
      <Navbar />
      <div className="app-container">
        {/* Static Sidebar for desktop */}
        <div className="d-none d-md-block sidebar">
          <Sidebar rooms={rooms} newChat={newChat} />
        </div>

        <Routes>
          <Route path="/chat/:roomId" element={<ChatRoomPage currentUser={currentUser} refreshRooms={fetchChatRooms} />} />
          <Route path="*" element={<div className="chat-window no-chat-selected">Select a chat</div>} />
        </Routes>

        {/* Static info for desktop */}
        <div className="d-none d-md-block room-info">
          <RoomInfoSidebar roomId={roomId} refreshRooms={fetchChatRooms} />
        </div>
      </div>

      {/* Offcanvas Sidebar */}
      <div 
        className="offcanvas offcanvas-start" 
        id="sidebarOffcanvas"
        data-bs-backdrop="true"
        data-bs-scroll="false"
        tabIndex="-1"
        aria-labelledby='sidebarLabel'
      >
        <div className="offcanvas-header">
          <h5 id="sidebarLabel">Chats</h5>
          <button className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body d-flex flex-column justify-content-between">
          {/* Top: Chat list */}
          <Sidebar rooms={rooms} newChat={newChat} />

          {/* Bottom: nav/profile button */}
          <div className="pt-3 border-top">
            <button 
              className="btn btn-light w-100 text-start" 
              data-bs-toggle="offcanvas" 
              data-bs-target="#mobileNavBarOffcanvas"
            >
              Your Account & Links
            </button>
          </div>
        </div>
      </div>

      {/* Offcanvas info */}
      <div 
        className="offcanvas offcanvas-end" 
        id="infoOffcanvas"
        data-bs-backdrop="true"
        data-bs-scroll="false"
        tabIndex="-1"
        aria-labelledby='infoLabel'
      >
        <div className="offcanvas-header">
          <h5 id="infoLabel">Room Info</h5>
          <button className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body">
          <RoomInfoSidebar roomId={roomId} refreshRooms={fetchChatRooms} />
        </div>
      </div>

      {/* Offcanvas Mobile nav bar */}
      <div
        className="offcanvas offcanvas-start"
        id="mobileNavBarOffcanvas"
        data-bs-backdrop="true"
        data-bs-scroll="false"
        tabIndex="-1"
      >
        <div className="offcanvas-header">
          <h5>Navigation</h5>
          <button className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body">
          {/* This is what the nav bar shows on desktop */}
          <ul className="list-group">
            {navLinks.map((link) => (
              <li className="list-item" key={link.path}>
                {link.isReact ? (
                  <Link className="text-decoration-none text-dark" to={link.path}>{link.name}</Link>
                ) : (
                  <a className="text-decoration-none text-dark" href={link.path}>{link.name}</a>
                )}
              </li>
            ))}
          </ul>
        </div>
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
