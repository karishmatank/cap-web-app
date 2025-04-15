import React from 'react';

function Searchbar({ setQuery, setRole }) {
    
    return (
        <div className='row justify-content-center mb-4'>
            <div className="col-md-6 d-flex">
                <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Search"
                    onChange={(event) => {
                        setQuery(event.target.value);
                    }}
                />
                <select
                    className='form-select'
                    style={{ maxWidth: '150px' }}
                    onChange={(event) => {
                        setRole(event.target.value);
                    }}
                >
                    <option value="">All</option>
                    <option value="mentor">Mentor</option>
                    <option value="mentee">Mentee</option>
                    <option value="admin">Administrator</option>
                </select>
            </div>
        </div>
    )
}

export default Searchbar;