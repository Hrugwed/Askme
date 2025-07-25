// src/App.jsx
import './App.css';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { MyContext } from './MyContext';
import { useState, useEffect, useContext } from 'react';
import { AuthProvider, AuthContext } from './AuthContext'; // Import AuthProvider and AuthContext
import AuthModal from './AuthModal'; // Import the AuthModal

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState(null);
  const [currentThread, setCurrentThread] = useState("");
  const [prevChats, setPrevChats] = useState([]);
  const [allThreads, setAllThreads] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false); // State for auth modal

  const { isAuthenticated, authLoading, user, logout } = useContext(AuthContext); // Use AuthContext

  // Initialize currentThread logic (modified)
  useEffect(() => {
    const initializeThread = async () => {
      setInitialLoading(true);
      // If not authenticated, we don't load threads, just show the welcome screen
      if (!isAuthenticated) {
        setCurrentThread("");
        setPrevChats([]);
        setAllThreads([]);
        setInitialLoading(false);
        return;
      }

      // If authenticated, fetch all threads for the user
      try {
        const response = await fetch("http://localhost:3000/api/threads", { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setAllThreads(data); // Populate sidebar threads

          if (data.length > 0) {
            // Default to the most recently updated thread for the user
            const latestThread = data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            setCurrentThread(latestThread.threadId);
            // Fetch messages for the latest thread
            const messagesResponse = await fetch(`http://localhost:3000/api/threads/${latestThread.threadId}`, { credentials: 'include' });
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              setPrevChats(messagesData);
            } else {
              console.warn(`Could not load messages for latest thread ${latestThread.threadId}. Starting new chat.`);
              setCurrentThread("");
              setPrevChats([]);
            }
          } else {
            // No threads exist for this user, start fresh
            setCurrentThread("");
            setPrevChats([]);
          }
        } else {
          console.error("Failed to fetch all threads on initial load or not authenticated.");
          setCurrentThread("");
          setPrevChats([]);
        }
      } catch (err) {
        console.error("Error during initial thread fetch:", err);
        setCurrentThread("");
        setPrevChats([]);
      } finally {
        setInitialLoading(false);
      }
    };

    // Only run this effect when authentication status changes or on initial mount
    // This ensures threads are loaded only after we know if user is authenticated
    if (!authLoading) { // Wait until auth status is determined
      initializeThread();
    }
  }, [isAuthenticated, authLoading]); // Dependency on isAuthenticated and authLoading

  const providerValues = {
    message, setMessage,
    chat, setChat,
    currentThread, setCurrentThread,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    initialLoading,
    setShowAuthModal // Pass setShowAuthModal down to children
  };

  // Render a loading state for authentication check
  if (authLoading) {
    return <div className='App'><p>Checking authentication status...</p></div>;
  }

  return (
    <div className='App'>
      <MyContext.Provider value={providerValues}>
        <AuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />
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