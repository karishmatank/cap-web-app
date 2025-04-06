import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import "../ChatRoomPage.css"
import EmojiPicker from 'emoji-picker-react';

function ChatRoomPage({ currentUser, refreshRooms }) {
    /* Access the parameter roomId*/
    const { roomId } = useParams();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const textareaRef = useRef(null);
    const [hasMore, setHasMore] = useState(true);
    const loadingOlderRef = useRef(null);
    const chatLogRef = useRef(null);
    const hasScrolledOnLoad = useRef(false);
    const [showPicker, setShowPicker] = useState(false);

    /* Reset message history upon roomId refresh */
    useEffect(() => {
        setMessages([]);
        setHasMore(true);
        hasScrolledOnLoad.current = false;
    }, [roomId]);

    const socketRef = useRef(null); // Ref to store the WebSocket instance
    const bottomRef = useRef(null); // For scrolling automatically to the bottom upon a new message
    const typingTimeout = useRef(null); // For detecting when a user is typing or not
    const [typingUser, setTypingUser] = useState(null); // For displaying a user who is typing

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

            if (data.type === "message") {
                setMessages((prev) => [...prev, data.message]);  /* Always appends to latest version of the state */
                hasScrolledOnLoad.current = false; // Adding this on to be able to trigger the scroll to bottom (see next)
            } else if (data.type === "typing") {
                if (data.user.id !== currentUser.id) {
                    setTypingUser(`${data.user.first_name} ${data.user.last_name}`);
                    setTimeout(() => {
                        setTypingUser(null);
                    }, 2000);
                }
            }
        }

        socket.onclose = () => {
            console.log("WebSocket disconnected.");
        }

        /* Called when the component unmounts (leave chat) or if we switch to a new roomId */
        return () => {
            socket.close();
        }
    }, [roomId, currentUser.id]);

    /* Detect when a user is typing */
    const handleTyping = () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(
                JSON.stringify({
                    "type": "typing",
                })
            );
        }

        // "Debounce to avoid flooding." This stops the "user is typing" message if the user doesn't type for 3s
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            // Not sending a stop typing message for now
        }, 2000);
    };

    /* When we receive a new message ("messages" is refreshed), 
    scroll to the bottom of the chat window + refresh room list on Sidebar to reflect latest message*/
    const refreshRoomsRef = useRef(refreshRooms);
    useEffect(() => {
        refreshRoomsRef.current = refreshRooms;
    }, [refreshRooms]);

    useEffect(() => {
        if (!hasScrolledOnLoad.current && messages.length > 0) {
            bottomRef.current?.scrollIntoView({'behavior': 'auto'});
            hasScrolledOnLoad.current = true;
            refreshRoomsRef.current();
        }
    }, [messages]);

    
    /* Whenever the roomId parameter changes, reload the message list */
    useEffect(() => {
        axios.get(`/chat/api/chats/${roomId}/messages/`)
        .then((response) => {
            setMessages(response.data.messages);
            setHasMore(response.data.has_more);
        })
        .catch((error) => {
            console.error("Error fetching messages", error);
        })
    }, [roomId]);

    /* Whenever the user scrolls to the top of the chat-log, if there are older messages, get those and display them */
    useEffect(() => {
        const chatLog = chatLogRef.current;
        if (!chatLog) return;

        const handleScroll = () => {
            if (chatLog.scrollTop < 50 && hasMore && !loadingOlderRef.current && messages.length > 0) {
                // Get timestamp of oldest message
                const oldestMessage = messages[0];
                const before = oldestMessage?.timestamp;
                if (!before) return;

                const previousScrollHeight = chatLog.scrollHeight;

                if (loadingOlderRef.current) return;
                loadingOlderRef.current = true;

                // Get older messages
                axios.get(`/chat/api/chats/${roomId}/messages/`, {
                    'params': { "before": before },
                })
                .then((response) => {
                    // Get a deduplicated list of all messages to be displayed
                    setMessages((prev) => {
                        const currentIds = new Set(messages.map((m) => m.id));
                        const deduped = response.data.messages.filter((m) => !currentIds.has(m.id));
                        return [...deduped, ...prev];
                    });
                    setHasMore(response.data.has_more);
                })
                .finally(() => {
                    loadingOlderRef.current = false;
                    // Maintain scroll position after loading older messages
                    setTimeout(() => {
                        chatLog.scrollTop = chatLog.scrollHeight - previousScrollHeight;
                    }, 0);
                });
            }
        };

        chatLog.addEventListener("scroll", handleScroll);
        return () => chatLog.removeEventListener("scroll", handleScroll);

    }, [hasMore, messages, roomId]);

    /* Handle emojis */
    const handleEmojiSelect = (emojiData) => {
        setNewMessage((prev) => prev + emojiData.emoji); // Append emoji to text
    };

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
            <div className="chat-log" ref={chatLogRef}>
                {(() => {
                    if (!hasMore) {
                        return <div className="chat-start-indicator">Start of chat history</div>
                    }
                })()}
                {Object.entries(groupedMessages).map(([date, messages]) => (
                    <div key={date}>
                        <div className="day-header">─── {date} ───</div>
                        {messages.map((msg) => {
                            
                            const isOwnMessage = msg.user.id === currentUser?.id;

                            return (
                                <div key={msg.id} className={`chat-message ${isOwnMessage ? "own" : "other"}`}>
                                    <span className="timestamp">
                                        {format(parseISO(msg.timestamp), "h:mm a")}{" "} 
                                    </span>
                                    <div className="bubble">
                                        <div className="sender-name">
                                            {msg.user.first_name} {msg.user.last_name}
                                        </div>
                                        <div className="message-text">
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="typing-user-indicator">
            {
                typingUser && <p>{typingUser} is typing...</p>
            }
            </div>
            <div className="message-input-form">
                <form className="message-input-form" onSubmit={(event) => {
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
                    <textarea
                        ref={textareaRef}
                        className="message-textarea" 
                        value={newMessage} 
                        onChange={(event) => {
                            setNewMessage(event.target.value);

                            handleTyping();
                            
                            // Auto resize
                            const textarea = textareaRef.current;
                            if (textarea) {
                                textarea.style.height = "auto";
                                textarea.style.height = `${textarea.scrollHeight - 20}px`;
                            }
                        }} 
                        placeholder="Type a message..."
                        rows={1}
                    />
                    <div className="emoji-container">
                        <button className="emoji-picker" type='button' onClick={() => setShowPicker((prev) => !prev)}>
                            😊
                        </button>
                        {showPicker && (
                            <div className="emoji-picker-popup">
                                <EmojiPicker onEmojiClick={handleEmojiSelect} />
                            </div>
                        )}
                    </div>
                    <button className="submit" type="submit" disabled={!isSocketReady} style={{ padding: "0.5rem" }}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );

}

export default ChatRoomPage;