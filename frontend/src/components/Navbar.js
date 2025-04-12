import { useEffect, useState, React } from 'react';
import axios from "axios";
import { Link } from 'react-router-dom';
// import navLinks from '../utils/navLinks';

function Navbar () {
    // Get links for desktop navbar
    const [links, setLinks] = useState([]);

    useEffect(() => {
        axios.get("/core/api/nav_links/")
        .then((response) => {
            setLinks(response.data);
        })
        .catch((error) => {
            console.error("Error getting navigation bar links", error);
        });
    }, []);

    return (
        <>
        <nav className="navbar sticky-top navbar-expand-md navbar-dark bg-dark d-none d-md-flex">
            <div className="container-fluid">
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <span className="navbar-brand">CAP Web App</span>

                <div className="collapse navbar-collapse" id="navbarMain">
                    <ul className="navbar-nav me-auto mb-2 mb-md-0">
                        {links.map((link) => (
                            <li className="nav-item" key={link.path}>
                                {link.isReact ? (
                                    <Link className="nav-link" to={link.path}>{link.name}</Link>
                                ) : (
                                    <a className="nav-link" href={link.path}>{link.name}</a>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </nav>
        <nav className="navbar sticky-top navbar-dark bg-dark d-md-none px-3 justify-content-between">
            <button className="btn btn-outline-secondary" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
                ☰
            </button>
            <span className="navbar-brand m-0">Chat</span>
            <button className="btn btn-outline-secondary" data-bs-toggle="offcanvas" data-bs-target="#infoOffcanvas">
                ⓘ
            </button>
        </nav>
        </>
    );
}

export default Navbar;