// src/App.jsx
import './App.css';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { MyContext } from './MyContext';
import { useState, useEffect, useContext } from 'react';
import { AuthProvider, AuthContext } from './AuthContext';
import AuthModal from './AuthModal';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';


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
        const response = await fetch(`${API_BASE_URL}/api/threads`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setAllThreads(data);

          if (data.length > 0) {
            const latestThread = data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            setCurrentThread(latestThread.threadId);
            const messagesResponse = await fetch(`${API_BASE_URL}/api/threads/${latestThread.threadId}`, { credentials: 'include' });
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
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

  // --- IMPROVED STYLING FOR AUTH LOADING ---
  if (authLoading) {
    return (
      <div className='App d-flex justify-content-center align-items-center' style={{ height: '100vh', flexDirection: 'column', backgroundColor: '#282c34', color: 'white' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Checking authentication status...</p>
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

        {/* Conditionally render Sidebar and ChatWindow only if authenticated */}
        {isAuthenticated ? (
            <>
                <Sidebar />
                <ChatWindow />
            </>
        ) : (
            // Display a message and a button if not authenticated and modal is not shown
            <div className="text-center p-5 d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#282c34', color: 'white' }}>
                <h1 className="mb-4">Welcome to Ask Me!</h1>
                <p className="lead mb-4">Please sign in or register to start chatting.</p>
                <button className="btn btn-primary btn-lg" onClick={() => setShowAuthModal(true)}>
                    Sign In / Register
                </button>
            </div>
        )}
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
