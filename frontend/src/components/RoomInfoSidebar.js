import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "../utils/csrf";

function RoomInfoSidebar({ roomId, refreshRooms }) {
    const [roomInfo, setRoomInfo] = useState(null);
    const [roomName, setRoomName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [desiredMembers, setDesiredMembers] = useState([]);

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
            setDesiredMembers(response.data.members);
        })
        .catch((error) => {
            console.error("Error fetching room info", error);
        });
    }, [roomId]);

    /* Trigger search when adding members to the room when searchQuery changes */
    useEffect(() => {
        const controller = new AbortController(); // For when we backspace too quickly and the API still shows results

        if (searchQuery.length === 0) {
            setSearchResults([]);
            return;
        }

        if (searchQuery.length < 2) return;

        const delay = setTimeout(() => {
            axios.get(`/users/api/search/?q=${searchQuery}`, {
                signal: controller.signal,
            })
            .then((response) => {
                setSearchResults(response.data);
            })
            .catch((error) => {
                if (error.name ==='CanceledError' || error.code === "ERR_CANCELED") {
                    // Request was cancelled, ignore
                    return;
                }
                console.error("Error searching for users", error);
            });
        }, 300); // Debounce delay 300 ms, avoids hitting API too frequently with every new letter
        
        return () => {
            clearTimeout(delay);
            controller.abort();
        };
    }, [searchQuery]);

    /* If the room hasn't loaded yet, just return a simple <div> */
    if (!roomInfo) return <div className="room-info-content">No room selected</div>

    return (
        <div className="room-info-content">
            <div className="card p-4 shadow-sm rounded-3">
                <h4 className="mb-0 fw-semibold">Room Name</h4>
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
                            <button 
                                type="submit" 
                                style={{ marginLeft: "0.5rem" }}
                                className="btn btn-outline-secondary btn-sm"
                            >
                                Save
                            </button>
                            <button 
                                type="button" 
                                style={{ marginLeft: "0.5rem" }}
                                onClick={() => {
                                    setRoomName(roomInfo.name);
                                    setIsEditing(false);
                                }}
                                className="btn btn-outline-secondary btn-sm"
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        // View only mode
                        <p className="mt-2 mb-0 text-muted">
                            {roomName}
                            <button 
                                onClick={() => (setIsEditing(true))} 
                                style={{ marginLeft: "0.5rem" }}
                                className="btn btn-outline-secondary btn-sm"
                            >
                                Edit
                            </button>
                        </p>
                    )
                } 
            </div>
            <div className="card p-4 shadow-sm rounded-3">
                <h4 className="fw-semibold mb-2">Members</h4>
                <ul className="list-unstyled ps-3 mb-0 text-muted">
                    {roomInfo.members.map((member) => (
                        <li key={member.id}>{member.first_name} {member.last_name}</li>
                    ))}
                </ul>

                <hr />

                <h5 className="fw-semibold">Add Members:</h5>
                <input 
                    type="text"
                    placeholder="Search for members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control mb-2"
                />
                {searchResults.length > 0 && (
                    <>
                    <div className="border rounded p-2" style={{ maxHeight: "250px", overflowY: "auto" }}>
                        {desiredMembers.map((user) => (
                            <div key={user.id} className="form-check">
                                <label className="form-check-label">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        // These users are already members, so they should be checked
                                        checked={desiredMembers.some((member) => member.id === user.id)}
                                        // Add users that we check off, remove those we uncheck
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setDesiredMembers((prev) => 
                                                    prev.some((u) => u.id === user.id) ? prev : [...prev, user]
                                                );
                                            } else {
                                                setDesiredMembers((prev) => prev.filter((u) => u.id !== user.id));
                                            }
                                        }}
                                    />
                                    {user.first_name} {user.last_name}
                                </label>
                            </div>
                        ))}
                        <hr />
                        {searchResults.filter(
                            (user) => desiredMembers.every((member) => member.id !== user.id)
                        ).map((user) => (
                            // I only want them to appear here if they are not already checked, thus not in desiredMemberIds
                            <div key={user.id} className="form-check">
                                <label className="form-check-label">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        // Checks if user is already a member. These should not be checked
                                        checked={desiredMembers.every((member) => member.id === user.id)}
                                        // Add users that we check off, remove those we uncheck
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setDesiredMembers((prev) => 
                                                    prev.some((u) => u.id === user.id) ? prev : [...prev, user]
                                                );
                                            } else {
                                                setDesiredMembers((prev) => prev.filter((u) => u.id !== user.id));
                                            }
                                        }}
                                    />
                                    {user.first_name} {user.last_name}
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="update-buttons">
                        <button
                            className="btn btn-dark w-100"
                            onClick={() => {
                                axios.patch(`/chat/api/chats/${roomId}/update/`, {
                                    'members': desiredMembers.map((m) => m.id)
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
                            Update
                        </button>
                        <button
                            className="btn btn-outline-secondary w-100"
                            onClick={() => {
                                setDesiredMembers(roomInfo.members);
                                setSearchQuery("");
                                setSearchResults([]);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                    </>
                )}
                
            </div>
        </div>
    );
}

export default RoomInfoSidebar;