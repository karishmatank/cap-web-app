import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "../utils/csrf";

function RoomInfoSidebar({ roomId, refreshRooms }) {
    const [roomInfo, setRoomInfo] = useState(null);
    const [roomName, setRoomName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [desiredMemberIds, setDesiredMemberIds] = useState([]);

    /* Get room info from roomId, refresh every time roomId changes */
    useEffect(() => {
        if (!roomId) {
            setRoomInfo(null);
            return;
        }

        axios.get(`/chat/api/chats/${roomId}/info/`)
        .then((response) => {
            setRoomInfo(response.data);
            setRoomName(response.data.name);
            setDesiredMemberIds(response.data.members.map((m) => m.id));
        })
        .catch((error) => {
            console.error("Error fetching room info", error);
        });
    }, [roomId]);

    /* Trigger search when adding members to the room when searchQuery changes */
    useEffect(() => {
        if (searchQuery.length < 2) return;

        axios.get(`/users/api/search/?q=${searchQuery}`)
        .then((response) => {
            setSearchResults(response.data)
        })
        .catch((error) => {
            console.error("Error searching for users", error);
        })
    }, [searchQuery]);

    /* If the room hasn't loaded yet, just return a simple <div> */
    if (!roomInfo) return <div className="room-info-content">No room selected</div>

    return (
        <div className="room-info-content">
            <h1>Room Info</h1>
            <div>
                <h3><u>Room Name</u></h3>
                {
                    isEditing ? (
                        <form onSubmit={(event) => {
                            event.preventDefault();
                            if (!roomName.trim()) {
                                return;
                            }

                            axios.patch(`/chat/api/chats/${roomId}/update/`, {
                                'name': roomName
                            }, {
                                'headers': {
                                    "X-CSRFToken": getCookie("csrftoken"),
                                }
                            })
                            .then((response) => {
                                setRoomInfo(response.data);
                                setRoomName(response.data.name);
                                setIsEditing(false);
                                refreshRooms(); // Sidebar update
                            })
                            .catch((error) => {
                                console.error("Failed to update room name", error);
                            });
                        }}
                        >
                            <input 
                                type="text" 
                                value={roomName} 
                                onChange={(event) => (
                                    setRoomName(event.target.value)
                                )}
                                style={{ marginLeft: "0.5rem" }}
                            />
                            <button type="submit" style={{ marginLeft: "0.5rem" }}>
                                Save
                            </button>
                            <button 
                                type="button" 
                                style={{ marginLeft: "0.5rem" }}
                                onClick={() => {
                                    setRoomName(roomInfo.name);
                                    setIsEditing(false);
                                }}
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        // View only mode
                        <p>
                            {roomName}
                            <button onClick={() => (setIsEditing(true))} style={{ marginLeft: "0.5rem" }}>Edit</button>
                        </p>
                    )
                } 
            </div>
            <div>
                <h3><u>Members</u></h3>
                <ul>
                    {roomInfo.members.map((member) => (
                        <li key={member.id}>{member.first_name} {member.last_name}</li>
                    ))}
                </ul>
                <h4>Add Members:</h4>
                <input 
                    type="text"
                    placeholder="Search for members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <ul>
                    {searchResults.map((user) => (
                        <li key={user.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    // Checks if user is already a member
                                    checked={desiredMemberIds.includes(user.id)}
                                    // Add users that we check off, remove those we uncheck
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setDesiredMemberIds((prev) => [...prev, user.id]);
                                        } else {
                                            setDesiredMemberIds((prev) => prev.filter((id) => id !== user.id));
                                        }
                                    }}
                                />
                                {user.first_name} {user.last_name}
                            </label>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => {
                        axios.patch(`/chat/api/chats/${roomId}/update/`, {
                            'members': desiredMemberIds
                        }, {
                            'headers': {
                                "X-CSRFToken": getCookie("csrftoken"),
                            },
                        })
                        .then((response) => {
                            setRoomInfo(response.data);
                            setSearchQuery("");
                            setSearchResults([]);
                        })
                        .catch((error) => {
                            console.error("Failed to update members", error);
                        })
                    }}
                >
                    Update Members
                </button>
            </div>
        </div>
    );
}

export default RoomInfoSidebar;