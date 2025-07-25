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
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isAuthenticated, authLoading, user, logout } = useContext(AuthContext);

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
    setShowAuthModal
  };

 
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