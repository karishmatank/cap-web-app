import { useEffect, useState, React } from 'react';
import axios from "../utils/axios";
import { Link } from 'react-router-dom';

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
        </>
    );
}

export default Navbar;