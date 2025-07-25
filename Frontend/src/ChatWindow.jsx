import { useContext, useState } from 'react';
import Chat from './Chat';
import './ChatWindow.css';
import { MyContext } from './MyContext';
import { AuthContext } from './AuthContext';
import 'react-loading-skeleton/dist/skeleton.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

function ChatWindow() {
  const { message, setMessage, currentThread, setCurrentThread, setPrevChats, initialLoading, setAllThreads, setShowAuthModal } = useContext(MyContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setPrevChats([]);
      setCurrentThread("");
      setAllThreads([]);
      setMessage("");
      setShowUserDropdown(false);
    } else {
      alert(result.message); // Consider a custom modal instead of alert() for better UX
    }
  };

  const getReply = async () => {
    if (!message.trim() || isLoading) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const userMessage = message;
    setMessage('');

    setPrevChats(prev => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "model", content: "", isSkeleton: true }
    ]);

    setIsLoading(true);

    try {
      const threadIdToSend = currentThread || null;

      const response = await fetch(`${API_BASE_URL}/api/chat`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: userMessage, threadId: threadIdToSend }),
        credentials: 'include'
      });

      if (response.status === 401) {
        setShowAuthModal(true);
        setIsLoading(false);
        setPrevChats(prev => prev.slice(0, prev.length - 2)); // Remove user message and skeleton
        return;
      }

      const data = await response.json();

      setPrevChats(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.isSkeleton) {
          updated[lastIndex] = { role: "model", content: data.Answer };
        }
        return updated;
      });

      if (data.thread?.threadId && data.thread.threadId !== currentThread) {
        setCurrentThread(data.thread.threadId);
        setAllThreads(prev => {
          const newThreads = [data.thread, ...prev.filter(t => t.threadId !== data.thread.threadId)];
          return newThreads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });
      } else if (data.thread) {
        setAllThreads(prev => {
          const updatedThreads = prev.map(t =>
            t.threadId === data.thread.threadId ? { ...t, updatedAt: data.thread.updatedAt } : t
          );
          return updatedThreads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });
      }

    } catch (error) {
      console.error('Error occurred:', error);
      setPrevChats(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.isSkeleton) {
          updated[lastIndex] = {
            role: "model",
            content: 'Error: Could not get a response. Please try again.'
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header d-flex justify-content-between align-items-center px-3 py-2">
        <div className="chat-title">
          <h3>Ask me</h3>
        </div>
        <div className="user-auth-section">
          {isAuthenticated ? (
            <div className="user-info" onClick={() => setShowUserDropdown(!showUserDropdown)}>
              <span>{user?.username} <i className="fa-solid fa-caret-down"></i></span>
              {showUserDropdown && (
                <div className="user-dropdown-menu">
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button className="auth-button" onClick={() => setShowAuthModal(true)}>
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-content">
        {!isAuthenticated ? (
          <p className="welcome-message">Please sign in to start chatting!</p>
        ) : initialLoading ? (
          <p className="loading-chat-msg">Preparing your chat...</p>
        ) : (
          <Chat />
        )}
      </div>

      {/* Input Box */}
      <div className="chat-input-section">
        <input
          type="text"
          className="chat-input"
          placeholder={isAuthenticated ? "Send a message..." : "Sign in to send messages..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' && !isLoading && isAuthenticated) ? getReply() : ''}
          disabled={isLoading || initialLoading || !isAuthenticated}
        />
        <button
          className="send-button"
          onClick={getReply}
          disabled={isLoading || initialLoading || !isAuthenticated}
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
}
export default ChatWindow;
