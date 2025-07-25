import "./Sidebar.css";
import { MyContext } from "./MyContext";
import { AuthContext } from './AuthContext';
import { useContext, useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
      const response = await fetch(`${API_BASE_URL}/api/threads`, { credentials: 'include' }); 
      if (response.status === 401) {
        setShowAuthModal(true);
        setAllThreads([]);
        return;
      }
      const data = await response.json();
      setAllThreads(data);
    } catch (error) {
      console.error("Error fetching threads: " + error);
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
      const response = await fetch(`${API_BASE_URL}/api/threads/${newThreadId}`, { credentials: 'include' }); // <--- CHANGED HERE
      if (response.status === 401) {
        setShowAuthModal(true);
        setPrevChats([]);
        setCurrentThread("");
        return;
      }
      const data = await response.json();
      setPrevChats(data);
      setChat(null);
    } catch (error) {
      console.error("Error loading thread:", error);
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
      const response = await fetch(`${API_BASE_URL}/api/threads/${threadIdToDelete}`, { 
        method: "DELETE",
        credentials: 'include'
      });
      if (response.status === 401) {
        setShowAuthModal(true);
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to delete thread');
      }

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
        await getAllThreads();
      }

      setActiveEllipsis(null);
    } catch (error) {
      console.error("Error deleting thread:", error);
      alert("Failed to delete chat. Please try again.");
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
                    e.stopPropagation();
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