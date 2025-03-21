import React, { useState } from "react";
import { SendIcon, UserIcon } from "lucide-react";
const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      user: "John Doe",
      text: "Hey everyone! What are you listening to?",
      time: "10:30",
      isCurrentUser: false,
    },
    {
      id: 2,
      user: "Jane Smith",
      text: "I'm loving the new album by The Weeknd!",
      time: "10:32",
      isCurrentUser: false,
    },
    {
      id: 3,
      user: "You",
      text: "I've been playing 'Blinding Lights' on repeat all day!",
      time: "10:35",
      isCurrentUser: true,
    },
  ]);
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        user: "You",
        text: message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isCurrentUser: true,
      };
      setMessages([...messages, newMessage]);
      setMessage("");
    }
  };
  const onlineUsers = [
    {
      id: 1,
      name: "John Doe",
    },
    {
      id: 2,
      name: "Jane Smith",
    },
    {
      id: 3,
      name: "Alex Johnson",
    },
    {
      id: 4,
      name: "Maria Garcia",
    },
    {
      id: 5,
      name: "David Kim",
    },
  ];
  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Music Chat</h1>
          <p className="text-gray-600">Connect with other music lovers</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto max-h-[calc(100vh-280px)]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 flex ${
                msg.isCurrentUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.isCurrentUser
                    ? "bg-gray-800 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                {!msg.isCurrentUser && (
                  <div className="font-medium text-sm mb-1">{msg.user}</div>
                )}
                <p className="text-sm">{msg.text}</p>
                <div
                  className={`text-xs mt-1 ${
                    msg.isCurrentUser ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            <SendIcon size={18} />
          </button>
        </form>
      </div>
      <div className="w-64 ml-6 bg-gray-50 rounded-lg p-4 hidden lg:block">
        <h3 className="font-medium mb-3">
          Online Users ({onlineUsers.length})
        </h3>
        <ul className="space-y-2">
          {onlineUsers.map((user) => (
            <li key={user.id} className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon size={16} className="text-gray-500" />
              </div>
              <span className="text-sm">{user.name}</span>
              <span className="ml-auto h-2 w-2 bg-green-500 rounded-full"></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
export default Chat;
