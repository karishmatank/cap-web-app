import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import RoomInfoSidebar from './components/RoomInfoSidebar';
import ChatRoomPage from './pages/ChatRoomPage';
import Navbar from './components/Navbar';
import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie } from './utils/csrf';
// import navLinks from './utils/navLinks';
import useIsMobile from './hooks/useIsMobile';
import useCurrentUser from './hooks/useCurrentUser';
import { Offcanvas } from 'bootstrap';

function Layout() {
  /* Get current user at start up */
  const isMobile = useIsMobile();
  const { currentUser, loading } = useCurrentUser();

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

        // If we're on mobile, close the current sidebar offcanvas and open up the room info offcanvas
        if (isMobile) {
          // Wait for sidebar offcanvas to close before triggering the room info offcanvas to open
          setTimeout(() => {
            const infoSidebarEl = document.getElementById("infoOffcanvas");
            const infoSidebar = Offcanvas.getOrCreateInstance(infoSidebarEl);
            infoSidebar.show();
          }, 300);
        }
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

  /* Check that there is a currentUser (user is authenticated) 
  Need to keep this for last because otherwise React freaks out about hooks not running in the same order every render
  given the if statements below*/
  if (loading) {
    return <div>Loading...</div>
  }

  if (!currentUser) {
    // Redirect user to login. Using localhost:8000 for now
    window.location.href = 'http://localhost:8000/users/login/?next=' + window.location.pathname;
    return null;
  }

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
          {/* <div className="mt-auto">
            <div className="dropup w-100">
              <button
                className="btn btn-light w-100 dropdown-toggle"
                type="button"
                id="accountDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Your Account
              </button>
              <ul className="dropdown-menu w-100" aria-labelledby="accountDropdown">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <button
                      type="button"
                      className="dropdown-item"
                      {...(isMobile ? { 'data-bs-dismiss': "offcanvas" } : {})}
                      onClick={() => {
                        link.isReact ? (
                          navigate(link.path)  
                        ) : (
                          window.location.href=link.path // Django link page refresh
                        )
                      }}
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div> */}
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
