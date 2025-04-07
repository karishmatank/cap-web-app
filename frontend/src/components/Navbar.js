import React from 'react';
import { Link } from 'react-router-dom';

function Navbar () {
    return (
        <nav className="navbar sticky-top navbar-expand-md navbar-light bg-light px-3">
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
                <span className="navbar-toggler-icon"></span>
            </button>
            <span className="navbar-brand">CAP Web App</span>

            <div className="collapse navbar-collapse" id="navbarMain">
                <ul className="navbar-nav me-auto mb-2 mb-md-0">
                    <li className="nav-item">
                        <Link className="nav-link" to="/">Chats</Link>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="">Profile</a>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;