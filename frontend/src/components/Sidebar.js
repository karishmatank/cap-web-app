import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";


function Sidebar() {
    /* We will store rooms in an empty list */
    const [rooms, setRooms] = useState([]);

    /* When the empty list renders upon loading, we'll populate it with a list of chat rooms
    that the user is a part of */
    useEffect(() => {
        axios.get("/chat/api/chats")
        .then((response) => {
            setRooms(response.data);
        })
        .catch((error) => {
            console.error("Error fetching rooms", error);
        });
    }, []);

    return (
        <div className="sidebar">
            <ul>
                {rooms.map((room) =>(
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