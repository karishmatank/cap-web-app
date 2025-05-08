import axios from 'axios';
import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar'; 
import Searchbar from './components/Searchbar';
import DirectoryResults from './components/DirectoryResults';
import useCurrentUser from './hooks/useCurrentUser';
import { useState, useEffect } from "react";

function Layout() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const { currentUser, loading } = useCurrentUser();

  /* Whenever query changes, we'll call the API to get results */
  useEffect(() => {
    const controller = new AbortController(); // For when we backspace too quickly and the API still shows results

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(() => {
      axios.get(`/users/api/community-search/?q=${query}&role=${role}`)
      .then((response) => {
        setSearchResults(response.data);
      })
      .catch((error) => {
        if (error.name ==='CanceledError' || error.code === "ERR_CANCELED") {
          // Request was cancelled, ignore
          return;
        }
        console.error("Error getting community search results", error);
      });
    }, 300); // Debounce delay 300 ms, avoids hitting API too frequently with every new letter

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [query, role]);

  /* Check that there is a currentUser (user is authenticated) 
  Need to keep this for last because otherwise React freaks out about hooks not running in the same order every render
  given the if statements below*/
  if (loading) {
    return <div>Loading...</div>
  }

  if (!currentUser) {
    // Redirect user to login.
    window.location.href = '/users/login/?next=' + window.location.pathname;
    return null;
  }

  return (
    <div className="main-wrapper">
      <Navbar />
      <div className="app-container mt-4">
        <Searchbar setQuery={setQuery} setRole={setRole} />
        <DirectoryResults results={searchResults} currentUser={currentUser} />
      </div>
    </div>
  );
}

function App() {
  
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
