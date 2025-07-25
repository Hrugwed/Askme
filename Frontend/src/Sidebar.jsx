import "./Sidebar.css";
import { MyContext } from "./MyContext";
import { AuthContext } from './AuthContext';
import { useContext, useEffect, useState } from "react";
import axios from 'axios'; // Import axios

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

function Sidebar() {
  const {
    allThreads,
    setAllThreads,
    currentThread,
    setCurrentThread,
    setPrevChats,
    setChat,
    setMessage,
    setShowAuthModal,
  } = useContext(MyContext);

  const { isAuthenticated, user, authLoading } = useContext(AuthContext);

  const [activeEllipsis, setActiveEllipsis] = useState(null);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      getAllThreads();
    } else if (!isAuthenticated && !authLoading) {
      setAllThreads([]);
    }
  }, [isAuthenticated, authLoading, currentThread]);

  const getAllThreads = async () => {
    try {
      // Use axios.get for fetching threads
      const response = await axios.get(`${API_BASE_URL}/api/threads`, { withCredentials: true }); 
      
      if (response.status === 200) { // Check for 200 OK status
        const data = response.data; // Axios response data is directly in .data
        setAllThreads(data);
      } else if (response.status === 401) { // Explicitly handle 401 if axios doesn't throw
        setShowAuthModal(true);
        setAllThreads([]);
      }
    } catch (error) {
      console.error("Error fetching threads: " + (error.response ? error.response.data : error.message));
      if (error.response && error.response.status === 401) {
        setShowAuthModal(true);
      }
      setAllThreads([]);
    }
  };

  const createNewThread = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setMessage("");
    setChat(null);
    setPrevChats([]);
    setCurrentThread("");
    setActiveEllipsis(null);
  };

  const changeThread = async (newThreadId) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setCurrentThread(newThreadId);
    setActiveEllipsis(null);
    try {
      // Use axios.get for changing threads
      const response = await axios.get(`${API_BASE_URL}/api/threads/${newThreadId}`, { withCredentials: true });
      
      if (response.status === 200) { // Check for 200 OK status
        const data = response.data; // Axios response data
        setPrevChats(data);
        setChat(null);
      } else if (response.status === 401) { // Explicitly handle 401 if axios doesn't throw
        setShowAuthModal(true);
        setPrevChats([]);
        setCurrentThread("");
      }
    } catch (error) {
      console.error("Error loading thread:", error.response ? error.response.data : error.message);
      if (error.response && error.response.status === 401) {
        setShowAuthModal(true);
      }
      setPrevChats([]);
      setCurrentThread("");
    }
  };

  const deleteThread = async (threadIdToDelete) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      // Use axios.delete for deleting threads
      const response = await axios.delete(`${API_BASE_URL}/api/threads/${threadIdToDelete}`, { 
        withCredentials: true
      });
      
      if (response.status === 200) { // Check for 200 OK status
        const updatedThreads = allThreads.filter((thread) => thread.threadId !== threadIdToDelete);
        setAllThreads(updatedThreads);

        if (threadIdToDelete === currentThread) {
          if (updatedThreads.length > 0) {
            const latestThread = updatedThreads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            setCurrentThread(latestThread.threadId);
            await changeThread(latestThread.threadId);
          } else {
            createNewThread();
          }
        } else {
          await getAllThreads(); // Refresh all threads to ensure consistent state
        }
        setActiveEllipsis(null);
      } else if (response.status === 401) { // Explicitly handle 401 if axios doesn't throw
        setShowAuthModal(true);
      } else {
        throw new Error('Failed to delete thread');
      }
    } catch (error) {
      console.error("Error deleting thread:", error.response ? error.response.data : error.message);
      if (error.response && error.response.status === 401) {
        setShowAuthModal(true);
      } else {
        alert("Failed to delete chat. Please try again."); // Consider a custom modal instead of alert()
      }
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button className="new-chat-button" onClick={createNewThread} disabled={!isAuthenticated}>
          <i
            className="fa-solid fa-face-smile fa-shake fa-lg"
            style={{ color: "#FFD43B" }}
          ></i>
          <span>New Chat</span>
          <i className="fa-solid fa-pen-to-square edit-icon"></i>
        </button>
      </div>

      <ul className="chat-history">
        {isAuthenticated && allThreads && allThreads.length > 0 ? (
          allThreads.map((thread, idx) => (
            <li
              key={idx}
              className={`chat-thread-item ${thread.threadId === currentThread ? 'active-thread' : ''}`}
            >
              <div className="thread-row">
                <span className="thread-title" onClick={() => changeThread(thread.threadId)}>
                  {thread.title}
                </span>
                <button
                  className="ellipsis-button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent parent li click
                    setActiveEllipsis(activeEllipsis === idx ? null : idx);
                  }}
                >
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </button>
              </div>

              {activeEllipsis === idx && (
                <div className="dropdown-menu">
                  <button onClick={(e) => {
                    e.stopPropagation();
                    deleteThread(thread.threadId);
                  }}>Delete</button>
                </div>
              )}
            </li>
          ))
        ) : isAuthenticated && !authLoading && allThreads.length === 0 ? (
          <li className="no-chats-message">No chats found. Click "New Chat" to start!</li>
        ) : !isAuthenticated && !authLoading ? (
          <li className="no-chats-message">Please sign in to see your chats.</li>
        ) : (
          <li className="no-chats-message">Loading chats...</li>
        )}
      </ul>

      <div className="created-by">
        <p>By Hrugwed using Gemini API</p>
      </div>
    </div>
  );
}
export default Sidebar;
