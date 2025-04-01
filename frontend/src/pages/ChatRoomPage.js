import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";

function ChatRoomPage() {
    /* Access the parameter roomId*/
    const { roomId } = useParams();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const socketRef = useRef(null); // Ref to store the WebSocket instance
    const bottomRef = useRef(null); // For scrolling automatically to the bottom upon a new message

    const [isSocketReady, setIsSocketReady] = useState(false);  // Prevents against sending a message too soon
    
    /* Open WebSocket connection */
    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const backendHost = "localhost:8000";
        const socket = new WebSocket(`${protocol}://${backendHost}/ws/chat/${roomId}/`);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connected.");
            setIsSocketReady(true);
        }

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            setMessages((prev) => [...prev, data.message]);  /* Always appends to latest version of the state */
        }

        socket.onclose = () => {
            console.log("WebSocket disconnected.");
        }

        /* Called when the component unmounts (leave chat) or if we switch to a new roomId */
        return () => {
            socket.close();
        }
    }, [roomId]);

    /* When we receive a new message ("messages" is refreshed), scroll to the bottom of the chat window */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({'behavior': 'smooth'});
    }, [messages]);

    /* Whenever the roomId parameter changes, reload the message list */
    useEffect(() => {
        axios.get(`/chat/api/chats/${roomId}/messages/`)
        .then((response) => {
            setMessages(response.data);
        })
        .catch((error) => {
            console.error("Error fetching messages", error);
        })
    }, [roomId]);

    /* Write a function to group message by date, as I want this displayed in the end div */
    function groupByDate(messages) {
        /* 
        .reduce() allows us to build a new object based on the existing messages array, in this case grouping 
        We'll first parse the date so JS can read it, then check if that date already exists in our resulting 
        "groups" object
        If it doesn't, we'll add a space for it and append the current message into that group using .push()
        */
        return messages.reduce((groups, message) => {
            const date = format(parseISO(message.timestamp), "MMMM d, yyyy");
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
            return groups;
        }, {});
    }

    const groupedMessages = groupByDate(messages);

    /* Format of groupedMessages is {"date": [msg1, msg2], ...} 
    Before we work with groupedMessages, we need to convert into an array of [key, value] pairs
    since .map() will only work with arrays and not objects. Object.entries does this*/

    return (
        <div className="chat-window">
            {Object.entries(groupedMessages).map(([date, messages]) => (
                <div key={date}>
                    <div className="day-header">─── {date} ───</div>
                    {messages.map((msg) => (
                        <div key={msg.id} className="message">
                            <span className="timestamp">
                                {format(parseISO(msg.timestamp), "h:mm a")}{" "} 
                            </span>
                            <span className="content">
                                {msg.user.first_name} {msg.user.last_name}: {msg.text}
                            </span>
                        </div>
                    ))}
                </div>
            ))}
            <div ref={bottomRef} />
            <form onSubmit={(event) => {
                event.preventDefault();
                if (!newMessage.trim()) {
                    return;
                }
                
                socketRef.current.send(
                    JSON.stringify({
                        "type": "chat_message",
                        "message": newMessage
                    })
                );

                setNewMessage("");
            }}>
                <input 
                    type="text" 
                    value={newMessage} 
                    onChange={(event) => setNewMessage(event.target.value)} 
                    placeholder="Type a message..."
                    style={{ width: "80%", padding: "0.5rem" }}
                />
                <button type="submit" disabled={!isSocketReady} style={{ padding: "0.5rem" }}>Send</button>
            </form>
        </div>
    );

}

export default ChatRoomPage;