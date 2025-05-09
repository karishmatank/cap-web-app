import { useEffect, useState, React, useRef } from 'react';
import axios from "../utils/axios";
// import { Link } from 'react-router-dom';
import Collapse from 'bootstrap/js/dist/collapse';

function Navbar () {
    // Get links for desktop navbar
    const [links, setLinks] = useState([]);
    const collapseRef = useRef(null);
    const collapseInstanceRef = useRef(null);
    const [openDropdown, setOpenDropdown] = useState(null);

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
            window.location.href = '/users/login/'
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

    // Manually trigger dropdowns
    const toggleDropdown = (name) => {
        setOpenDropdown((prev) => (prev === name ? null : name))
    };

    return (
        <>
        <nav className="navbar sticky-top navbar-expand-md navbar-dark bg-dark">
            <div className="container-fluid">
                {/* Navbar toggler (hamburger) for collapse on mobile
                    Note that this doesn't include data-bs-toggle and data-bs-target
                    The axios pull is interfering with the ability for the hamburger icon to collapse the nav bar
                    as it was re-rendering the links as Bootstrap was trying to collapse the nav bar
                    Instead, we'll control this ourselves using Javascript by telling a Collapse instance to toggle
                    directly when the icon is clicked
                */}
                <button className="navbar-toggler" type="button" onClick={toggleNavbar}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                <span className="navbar-brand">CAP Web App</span>

                <div className="collapse navbar-collapse" id="navbarMainCommunity" ref={collapseRef}>
                    <ul className="navbar-nav me-auto mb-2 mb-md-0">
                        {links.map((link) => 
                            link.children ? (
                                <li className="nav-item dropdown" key={link.path}>
                                    <a 
                                        className={`nav-link dropdown-toggle ${openDropdown === link.name ? 'show' : ''}`} 
                                        href="#!" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleDropdown(link.name);
                                        }}
                                        role="button"
                                        aria-expanded={openDropdown === link.name}
                                    >
                                        {link.name}
                                    </a>
                                    <ul className={`dropdown-menu ${openDropdown === link.name ? 'show' : ''}`}>
                                        {link.children.map((child) => 
                                            <li key={child.path}>
                                                {child.isReact ? (
                                                    // <Link className="dropdown-item" to={child.path}>{child.name}</Link>
                                                    <a className="dropdown-item" href={child.path}>{child.name}</a>
                                                ) : (
                                                    <a className="dropdown-item" href={child.path}>{child.name}</a>
                                                )}
                                            </li>
                                        )}
                                    </ul>
                                </li>
                            ) : (
                                <li className="nav-item" key={link.path}>
                                    {link.isReact ? (
                                        // <Link className="nav-link" to={link.path}>{link.name}</Link>
                                        <a className="nav-link" href={link.path}>{link.name}</a>
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
                            )
                        )}
                    </ul>
                </div>
            </div>
        </nav>
        </>
    );
}

export default Navbar;