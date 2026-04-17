import React, { useState, useRef, useEffect } from "react";
import { SendIcon, UserIcon, SearchIcon } from "lucide-react";

interface Users {
  id: number;
  username: string;
  email: string;
  status: number;
  unread?: boolean;
}

interface Message {
  id: number;
  user: string;
  content: string;
  time: string;
  isCurrentUser: boolean;
}

const Chat = () => {
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Users | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [listUser, setListUsers] = useState<Users[]>([]);
  const [userMessages, setUserMessages] = useState<{ [key: string]: Message[] }>({});
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedUser, userMessages]);

  useEffect(() => {
    if (selectedUser && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser]);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserEmail = currentUser?.email;
  const currentUserId = currentUser?.id;

  // Debug currentUser
  useEffect(() => {
    console.log("currentUser:", currentUser);
    console.log("currentUserId:", currentUserId);
    if (!currentUser || !currentUserId) {
      setError("User not logged in. Please log in to continue.");
    } else {
      setError(null);
    }
  }, [currentUser]);

  // Gọi API để lấy danh sách user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/users/", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const data: Users[] = await response.json();
        console.log("Fetched users:", data);
        const filteredData = data
          .filter((user) => user.email !== currentUserEmail)
          .map((user) => ({ ...user, unread: false }));
        setListUsers(filteredData);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users. Please try again.");
      }
    };

    if (currentUser && currentUserId) {
      fetchUsers();
    }
  }, [currentUserEmail, currentUserId]);

  // Gọi API để lấy tin nhắn
  const fetchMessages = async () => {
    if (!selectedUser || !currentUserId) {
      console.log("fetchMessages skipped: missing selectedUser or currentUserId");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/messages/?sender_id=${currentUserId}&receiver_id=${selectedUser.id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched messages:", JSON.stringify(data, null, 2));

      const messages: Message[] = data.map((msg: any) => {
        if (!msg.sender || msg.sender === undefined) {
          console.error(`Invalid sender data for message ID ${msg.id}:`, msg);
          return {
            id: msg.id,
            content: msg.content || "No content",
            time: msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Unknown time",
            isCurrentUser: false,
          };
        }

        const senderId = Number(msg.sender);
        const isCurrentUser = senderId === Number(currentUserId);
        console.log(
          `Message ID: ${msg.id}, Sender ID: ${senderId}, currentUserId: ${currentUserId}, isCurrentUser: ${isCurrentUser}`
        );
        return {
          id: msg.id,
          content: msg.content,
          time: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isCurrentUser,
        };
      });

      // Kiểm tra tin nhắn cuối cùng
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        setListUsers((prev) =>
          prev.map((user) =>
            user.id === selectedUser.id
              ? { ...user, unread: !lastMessage.isCurrentUser }
              : user
          )
        );
      }

      setUserMessages((prev) => {
        const updatedMessages = { ...prev, [selectedUser.email]: messages };
        console.log("Updated userMessages:", updatedMessages);
        return updatedMessages;
      });
      setError(null);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages. Please try again.");
      setUserMessages((prev) => ({
        ...prev,
        [selectedUser.email]: [],
      }));
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedUser, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim() && selectedUser && currentUserId) {
      setIsLoading(true);
      setError(null);
      console.log("Sending message:", {
        sender_id: currentUserId,
        receiver_id: selectedUser.id,
        content: message,
      });

      try {
        const response = await fetch("http://127.0.0.1:8000/api/send_message/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender_id: currentUserId,
            receiver_id: selectedUser.id,
            content: message,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Send message error:", errorData);
          throw new Error(errorData.message || "Failed to send message");
        }

        const responseData = await response.json();
        console.log("Send message response:", responseData);

        await fetchMessages();
        // Xóa unread sau khi gửi tin nhắn
        setListUsers((prev) =>
          prev.map((user) =>
            user.id === selectedUser.id ? { ...user, unread: false } : user
          )
        );
        setMessage("");
      } catch (error: any) {
        console.error("Error sending message:", error);
        setError(error.message || "Failed to send message. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("Send message skipped: invalid input or missing user");
      setError("Cannot send message. Please select a user and type a message.");
    }
  };

  const filteredUsers = listUser.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error && !selectedUser) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-black">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-black overflow-hidden">
      <div className="w-80 bg-gray-900">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            Online Users ({filteredUsers.length})
          </h3>
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <SearchIcon
              size={18}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
        <ul className="space-y-2 overflow-y-auto h-[calc(100vh-184px)] px-4">
          {filteredUsers.map((user) => (
            <li
              key={user.id}
              onClick={() => {
                setSelectedUser(user);
                // Xóa dấu chưa đọc khi chọn người dùng
                setListUsers((prev) =>
                  prev.map((u) =>
                    u.id === user.id ? { ...u, unread: false } : u
                  )
                );
              }}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                selectedUser?.email === user.email ? "bg-blue-600" : "hover:bg-gray-800"
              }`}
            >
              <div className="relative h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                <UserIcon size={20} className="text-gray-300" />
                {user.unread && (
                  <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-gray-900"></span>
                )}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-white">{user.username}</span>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <span
                className={`h-3 w-3 rounded-full ${
                  user.status === 1 ? "bg-green-400" : "bg-gray-400"
                }`}
              ></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col bg-black">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <UserIcon size={20} className="text-gray-300" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-white">{selectedUser.username}</h1>
                    <p className="text-xs text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {error && <div className="text-red-500 text-center mb-4">{error}</div>}
              {userMessages[selectedUser.email]?.length > 0 ? (
                userMessages[selectedUser.email].map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-3 flex ${msg.isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl p-3 shadow-sm ${
                        msg.isCurrentUser ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200"
                      }`}
                    >
                      {!msg.isCurrentUser && msg.user && (
                        <div className="font-medium text-xs mb-1">{msg.user}</div>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <div className="text-xs mt-1 opacity-70 text-right">{msg.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-lg">No messages yet. Start chatting!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-800 bg-black"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600"
                  disabled={isLoading}
                >
                  <SendIcon size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-lg">Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;