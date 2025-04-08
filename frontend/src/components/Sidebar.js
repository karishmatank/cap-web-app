import { useLocation, matchPath, useNavigate } from "react-router-dom";
import "../Sidebar.css"
import useIsMobile from "../hooks/useIsMobile";

function Sidebar({ rooms, newChat }) {
    /* Get the active room ID so that we can style it differently */
    const location = useLocation();
    const match = matchPath("/chat/:roomId", location.pathname);
    const activeRoomId = match?.params?.roomId;
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    
    return (
        <div className="sidebar-content">
            <button className="new-chat-btn" onClick={newChat}>
                + New Chat
            </button>
            <div className="chat-room-list">
                {rooms.map((room) => {
                    const isActive = String(room.id) === activeRoomId;
                    
                    return (
                        <button
                            type="button"
                            key={room.id} 
                            className={`chat-room-card ${isActive ? "active": ""}`}
                            {...(isMobile ? { 'data-bs-dismiss': "offcanvas" } : {})}
                            onClick={() => {
                                navigate(`/chat/${room.id}`)
                            }}
                        >
                            <div className="room-name">
                                {room.name || "Untitled Room"}
                            </div>
                            {room.last_message && (
                                <div className="message-preview">
                                    {room.last_message.user.first_name}: {room.last_message.text}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

}

export default Sidebar;