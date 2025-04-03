import { Link, useLocation, matchPath } from "react-router-dom";
import "../Sidebar.css"

function Sidebar({ rooms, newChat }) {
    /* Get the active room ID so that we can style it differently */
    const location = useLocation();
    const match = matchPath("/chat/:roomId", location.pathname);
    const activeRoomId = match?.params?.roomId;

    return (
        <div className="sidebar">
            <button className="new-chat-btn" onClick={newChat}>
                + New Chat
            </button>
            <div className="chat-room-list">
                {rooms.map((room) => {
                    const isActive = String(room.id) === activeRoomId;
                    
                    return (
                        <Link to={`/chat/${room.id}`} key={room.id} className={`chat-room-card ${isActive ? "active": ""}`}>
                            <div className="room-name">
                                {room.name || "Untitled Room"}
                            </div>
                            {room.last_message && (
                                <div className="message-preview">
                                    <strong>{room.last_message.user.first_name}: </strong>{room.last_message.text}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );

}

export default Sidebar;