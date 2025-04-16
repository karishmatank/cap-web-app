import React from 'react';
import axios from '../utils/axios'
import { useState, useRef } from "react";
import { Modal } from 'bootstrap';

function DirectoryResults({ results, currentUser }) {
    const [targetUser, setTargetUser] = useState(null);
    const modalRef = useRef(null);

    const openModal = (user) => {
        setTargetUser(user);

        // Show modal using Bootstrap JS API
        const modal = new Modal(modalRef.current);
        modal.show();
    }

    const handlePrivateChat = () => {
        axios.post('chat/api/chats/start_private_chat/', {
            'target_user_id': targetUser.id,
        })
        .then((response) => {
            // Navigate to the newly created chat room
            const roomId = response.data.room_id;

            // Redirect to the chat room
            window.location.href = `http://localhost:3000/chat/${roomId}/`;

            // In production
            // window.location.href = `/chat/${roomId}/`;
        })
        .catch((error) => {
            console.error("Error creating private chat", error);
            alert("Something went wrong while starting the chat.");
        });
    };

    return (
        <div className="query-results container mt-4 ">
            {results.map((result) => (
                <div className="result-card card mb-3 mx-auto" style={{ maxWidth: "700px" }} key={result.id}>
                    <div className="card-body">
                        <div className="result-header d-flex justify-content-between align-items-start flex-wrap">
                            
                            <h5 className='card_title mb-1 d-flex align-items-center'>
                                {result.user.first_name} {result.user.last_name}
                                <span
                                    className={`badge ${
                                        result.role === 'mentor' ? ('bg-primary') 
                                        : result.role === 'mentee' ? ('bg-success') 
                                        : ('bg-warning')
                                    } text-capitalize ms-2`}
                                >
                                    {result.role}
                                </span>
                            </h5>
                            
                            <div className='mt-0'>
                                <button
                                    className='btn btn-outline-primary'
                                    type='button'
                                    disabled={result.user.id === currentUser.id}
                                    onClick={() => openModal(result.user)}
                                >
                                    Start Chat
                                </button>
                            </div>
                        </div>
                        <div className="result-text mt-3">
                            {result.role === 'mentee' ? (
                                <>
                                    <div className='result-mentees mb-2'>
                                        <strong>Mentor:</strong>{" "}
                                        {result.mentors.map((mentor) => (
                                            <span key={mentor.id}>{mentor.first_name} {mentor.last_name}{" "}</span>
                                        ))}
                                    </div>
                                    <div className='result-grad mb-2'><strong>HS Graduation Year: </strong>{result.graduation_year}</div>
                                </>
                            ) : result.role === 'mentor' ? (
                                <>
                                    <div className='result-college mb-2'><strong>College Attended: </strong>{result.college_attended}</div>
                                    <div className='result-majors mb-2'><strong>College Major(s): </strong>{result.college_major}</div>
                                    <div className='result-experience mb-2'><strong>Experience: </strong>{result.experience}</div>
                                </>
                            ) : null}
                            <div className='result-interests mb-2'><strong>Interests: </strong>{result.interests}</div>
                            <div className='result-other'><strong>Other Information: </strong>{result.other}</div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Modal */}
            <div className='modal fade' tabIndex="-1" ref={modalRef} aria-labelledby='startChatModalLabel' aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="startChatModalLabel">Start Chat</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" />
                        </div>
                        <div className="modal-body">
                            {targetUser && (
                                <p>
                                    Start a new chat with <strong>{targetUser.first_name} {targetUser.last_name}</strong>?
                                </p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={handlePrivateChat}>
                                Start Chat
                            </button>
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DirectoryResults;