import React from 'react';

function DirectoryResults({ results, currentUser }) {
    return (
        <div className="query-results container mt-4 ">
            {results.map((result) => (
                <div className="result-card card mb-3 mx-auto" style={{ maxWidth: "700px" }} key={result.id}>
                    <div className="card-body">
                        <div className="result-header d-flex justify-content-between align-items-start flex-wrap">
                            
                            <h5 className='card_title mb-1 d-flex align-items-center'>
                                {result.user.first_name} {result.user.last_name}
                                <span
                                    className={`badge ${result.role === 'mentor' ? 'bg-primary' : 'bg-success'} text-capitalize ms-2`}
                                >
                                    {result.role}
                                </span>
                            </h5>
                            
                            <div className='mt-2 mt-md-0'>
                                <button
                                    className='btn btn-outline-primary'
                                    type='button'
                                    disabled={result.user.id === currentUser.id}
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
        </div>
    );
}

export default DirectoryResults;