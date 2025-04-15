import { useEffect, useState, React, useRef } from 'react';
import axios from "../utils/axios";
import { Link } from 'react-router-dom';
import Collapse from 'bootstrap/js/dist/collapse';
// import navLinks from '../utils/navLinks';

function Navbar () {
    // Get links for desktop navbar
    const [links, setLinks] = useState([]);
    const collapseRef = useRef(null);
    const collapseInstanceRef = useRef(null);

    useEffect(() => {
        axios.get("/core/api/nav_links/")
        .then((response) => {
            setLinks(response.data);
        })
        .catch((error) => {
            console.error("Error getting navigation bar links", error);
        });
    }, []);

    useEffect(() => {
        if (collapseRef.current) {
            collapseInstanceRef.current = new Collapse(collapseRef.current, { toggle: false });
        }
    }, []);

    // Handle post request for logout
    const handleLogout = () => {
        axios.post("/users/logout/")
        .then(() => {
            window.location.href = 'http://localhost:8000/users/login/'
        })
        .catch((error) => {
            console.log("Error logging out", error);
        });
    }

    const toggleNavbar = () => {
        if (collapseInstanceRef.current) {
            collapseInstanceRef.current.toggle();
        }
    };

    return (
        <nav className="navbar sticky-top navbar-expand-md navbar-dark bg-dark">
            <div className="container-fluid">
                {/* Mobile-only left icon */}
                <button className="btn btn-outline-secondary d-md-none me-2" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
                    <i className="bi bi-chat-dots"></i>
                </button>

                <span className="navbar-brand">CAP Web App</span>

                {/* Mobile-only right icon */}
                <button className="btn btn-outline-secondary d-md-none ms-auto" data-bs-toggle="offcanvas" data-bs-target="#infoOffcanvas">
                    ⓘ
                </button>

                {/* Navbar toggler (hamburger) for collapse on mobile
                    Note that this doesn't include data-bs-toggle and data-bs-target
                    The axios pull is interfering with the ability for the hamburger icon to collapse the nav bar
                    as it was re-rendering the links as Bootstrap was trying to collapse the nav bar
                    Instead, we'll control this ourselves using Javascript by telling a Collapse instance to toggle
                    directly when the icon is clicked
                */}
                <button className="navbar-toggler ms-2" type="button" onClick={toggleNavbar}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                
                {/* Navbar */}
                <div className="collapse navbar-collapse" id="navbarMainChat" ref={collapseRef}>
                    <ul className="navbar-nav me-auto mb-2 mb-md-0">
                        {links.map((link) => (
                            <li className="nav-item" key={link.path}>
                                {link.isReact ? (
                                    <Link className="nav-link" to={link.path}>{link.name}</Link>
                                ) : link.method === 'get' ? (
                                    <a className="nav-link" href={link.path}>{link.name}</a>
                                ) : (
                                    <button 
                                        onClick={(event) => {
                                            event.preventDefault(); // Prevent get request
                                            handleLogout();
                                        }} 
                                        className="nav-link"
                                    >
                                        {link.name}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;