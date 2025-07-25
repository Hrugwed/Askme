import { useContext, useEffect, useRef, useState } from "react";
import "./Chat.css";
import { MyContext } from "./MyContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

function Chat() {
  const { prevChats, currentThread } = useContext(MyContext);
  const chatEndRef = useRef(null);
  const [displayedTexts, setDisplayedTexts] = useState([]);
  const prevChatLengthRef = useRef(0);
  const prevThreadIdRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedTexts]);

  useEffect(() => {
    const latestChat = prevChats?.[prevChats.length - 1];
    const threadChanged = currentThread !== prevThreadIdRef.current;

    const isNewModelMessage =
      prevChats.length > prevChatLengthRef.current &&
      latestChat?.role === "model" &&
      latestChat?.isSkeleton === false &&
      !threadChanged;

    prevChatLengthRef.current = prevChats.length;
    prevThreadIdRef.current = currentThread;

    if (threadChanged && prevChats.length > 0) {
      setDisplayedTexts(prevChats);
      return;
    }

    if (isNewModelMessage) {
      const words = latestChat.content.split(" ");
      let current = "";
      let i = 0;

      const interval = setInterval(() => {
        if (i < words.length) {
          current += (i === 0 ? "" : " ") + words[i];
          setDisplayedTexts((prev) => {
            const updated = [...prevChats];
            if (updated[prevChats.length - 1]) {
                updated[prevChats.length - 1] = {
                    ...latestChat,
                    content: current,
                };
            }
            return updated;
          });
          i++;
        } else {
          clearInterval(interval);
        }
      }, 10);

      return () => clearInterval(interval);
    } else {
      setDisplayedTexts(prevChats);
    }
  }, [prevChats, currentThread]);

  return (
    <>
      <div className="chat">
        {displayedTexts.map((chat, idx) => (
          <div
            className={chat.role === "user" ? "user-chat-box" : "model-chat-box"}
            key={idx}
          >
            {chat.isSkeleton ? (
              <div className="ai-response-skeleton-inline">
                <Skeleton className="skeleton-title" width="80%" />
                <Skeleton className="skeleton-text-line" count={2} />
                <Skeleton className="skeleton-last-line" width="60%" />
              </div>
            ) : chat.role === "user" ? (
              <p className="user-message">{chat.content}</p>
            ) : (
              <div className="model-message markdown-output">
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {chat.content == null
                    ? "Ask me but later, busy right now. Try again!"
                    : chat.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </>
  );
}

export default Chat;