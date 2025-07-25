// src/App.jsx
import './App.css';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { MyContext } from './MyContext';
import { useState, useEffect, useContext } from 'react';
import { AuthProvider, AuthContext } from './AuthContext';
import AuthModal from './AuthModal';
import axios from 'axios'; // Import axios


// API_BASE_URL will be read from .env.local locally, and from Vercel env vars in deployment
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');


function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState(null);
  const [currentThread, setCurrentThread] = useState("");
  const [prevChats, setPrevChats] = useState([]);
  const [allThreads, setAllThreads] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false); // State for auth modal

  const { isAuthenticated, authLoading, user, logout } = useContext(AuthContext);

  // Effect to manage AuthModal visibility based on authentication status
  // This will now automatically show the modal if not authenticated after authLoading is false
  useEffect(() => {
    if (isAuthenticated) {
      setShowAuthModal(false); // Hide modal if user becomes authenticated
    } else {
      // Show modal if not authenticated AND initial auth check is complete
      // This makes the modal pop up automatically if a user lands on the page unauthenticated.
      setShowAuthModal(!authLoading && !isAuthenticated);
    }
  }, [isAuthenticated, authLoading]); // Depend on isAuthenticated and authLoading

  // Effect for initializing chat threads
  useEffect(() => {
    const initializeThread = async () => {
      setInitialLoading(true);
      if (!isAuthenticated) {
        setCurrentThread("");
        setPrevChats([]);
        setAllThreads([]);
        setInitialLoading(false);
        return;
      }

      try {
        // Use axios.get for fetching threads
        const response = await axios.get(`${API_BASE_URL}/api/threads`, { withCredentials: true });

        if (response.status === 200) { // Check for 200 OK status
          const data = response.data; // Axios response data is directly in .data
          setAllThreads(data);

          if (data.length > 0) {
            const latestThread = data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            setCurrentThread(latestThread.threadId);
            // Use axios.get for fetching messages for a specific thread
            const messagesResponse = await axios.get(`${API_BASE_URL}/api/threads/${latestThread.threadId}`, { withCredentials: true });
            if (messagesResponse.status === 200) { // Check for 200 OK status
              const messagesData = messagesResponse.data; // Axios response data
              setPrevChats(messagesData);
            } else {
              console.warn(`Could not load messages for latest thread ${latestThread.threadId}. Starting new chat.`);
              setCurrentThread("");
              setPrevChats([]);
            }
          } else {
            setCurrentThread("");
            setPrevChats([]);
          }
        } else {
          // This block might not be reached if axios throws on non-2xx status
          console.error("Failed to fetch all threads on initial load or not authenticated.");
          setCurrentThread("");
          setPrevChats([]);
        }
      } catch (err) {
        console.error("Error during initial thread fetch:", err.response ? err.response.data : err.message);
        // Handle 401 specifically if needed, otherwise general error
        if (err.response && err.response.status === 401) {
          setShowAuthModal(true); // Show auth modal on 401
        }
        setCurrentThread("");
        setPrevChats([]);
      } finally {
        setInitialLoading(false);
      }
    };

    // Only run this effect for initializing threads once authLoading is false
    // and when isAuthenticated changes.
    if (!authLoading) {
      initializeThread();
    }
  }, [isAuthenticated, authLoading]);

  const providerValues = {
    message, setMessage,
    chat, setChat,
    currentThread, setCurrentThread,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    initialLoading,
    setShowAuthModal // Pass setShowAuthModal down to children
  };

  // If authLoading is true, display a simple loading spinner.
  // This is a brief state before the isAuthenticated check is finalized.
  if (authLoading) {
    return (
      <div className='App d-flex justify-content-center align-items-center'>
        <div className="dot-pulse-loader">
          <span></span><span></span><span></span>
        </div>
        <p className="mt-3">Getting things ready...</p>
      </div>

    );
  }

  return (
    <div className='App'>
      <MyContext.Provider value={providerValues}>
        {/* Render AuthModal ONLY if showAuthModal is true */}
        {showAuthModal && (
          <AuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />
        )}

        {/* Always render Sidebar and ChatWindow. Their content will adapt based on isAuthenticated. */}
        <Sidebar />
        <ChatWindow />
      </MyContext.Provider>
    </div>
  );
}

// Export App wrapped with AuthProvider
export default function AppWithAuthProvider() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
