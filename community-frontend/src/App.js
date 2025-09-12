import axios from 'axios';
import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar'; 
import Searchbar from './components/Searchbar';
import DirectoryResults from './components/DirectoryResults';
import useCurrentUser from './hooks/useCurrentUser';
import { useState, useEffect, useRef } from "react";
import PushInitializer from './components/PushInitializer';

function Layout() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mentorResults, setMentorResults] = useState([]);
  const didInitialFetch = useRef(false);
  const { currentUser, loading } = useCurrentUser();

  // Let's get an initial list of results to show on the screen so it's not just a blank page
  // Instead of pulling everyone's info, I'll stick to just mentors
  useEffect(() => {
    if (didInitialFetch.current) return;

    didInitialFetch.current = true;

    axios.get('/users/api/community-search/?q=&role=mentor')
    .then((response) => {
      setMentorResults(response.data);
    })
    .catch((error) => {
      if (error.name ==='CanceledError' || error.code === "ERR_CANCELED") {
        // Request was cancelled, ignore
        return;
      }
      console.error("Error getting initial community search results", error);
    });
  }, [currentUser, loading]);

  /* Whenever query changes, we'll call the API to get results */
  useEffect(() => {
    const controller = new AbortController(); // For when we backspace too quickly and the API still shows results

    if (query.length < 2) {
      setSearchResults(mentorResults);
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
  }, [query, role, mentorResults]);

  /* Check that there is a currentUser (user is authenticated) 
  Need to keep this for last because otherwise React freaks out about hooks not running in the same order every render
  given the if statements below*/
  if (loading) {
    return <div>Loading...</div>
  }

  if (!currentUser) {
    // Redirect user to login.
    window.location.href = '/login/?next=' + window.location.pathname;
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
      <PushInitializer />
      <Layout />
    </Router>
  );
}

export default App;
