import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar'; 
import useCurrentUser from './hooks/useCurrentUser';
import ApplicationList from './components/ApplicationList';
import ApplicationPlatformSurvey from './components/ApplicationPlatformSurvey';
import ToDoFullList from './components/ToDoFullList';
import { Tab, Tabs } from 'react-bootstrap';

function Layout() {
  const { currentUser, loading } = useCurrentUser();

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
      <div className="app-container">
        <ApplicationPlatformSurvey currentUser={currentUser} />
        <Tabs
          defaultActiveKey="applications"
        >
          <Tab eventKey="applications" title="Applications">
            <ApplicationList currentUser={currentUser} />
          </Tab>
          <Tab eventKey="todos" title="To Dos">
            <ToDoFullList currentUser={currentUser} />
          </Tab>
        </Tabs>
      </div>
    </div>
  )
}

function App() {
  
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
