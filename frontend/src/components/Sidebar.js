import { Link } from "react-router-dom";

function Sidebar({ rooms, newChat }) {
    
    return (
        <div className="sidebar">
            <button onClick={newChat} style={{ margin: "1rem" }}>
                + New Chat
            </button>
            <ul>
                {rooms.map((room) => (
                    <li key={room.id}>
                        <Link to={`/chat/${room.id}`}>
                            {room.name || "Untitled Room"}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );

}

export default Sidebar;