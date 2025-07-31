"use client";
import Cookies from "js-cookie";
import Chatsidebar from "@/components/Chatsidebar";
import Loading from "@/components/Loading";
import { chat_service, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";
import { SocketData } from "@/context/SocketContext";

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const chatApp = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    setChats,
  } = useAppData();

  const { onlineUsers, socket } = SocketData();

  console.log(onlineUsers);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAllUser, setShowAllUser] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeOut, setTypingTimeOut] = useState<NodeJS.Timeout | null>(
    null
  );

  const router = useRouter();
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  const handleLogout = () => logoutUser();

  async function fetchChat() {
    const token = Cookies.get("token");
    try {
      const { data } = await axios.get(
        `${chat_service}/api/v1/message/${selectedUser}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(data.messages);
      setUser(data.user);
      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages");
    }
  }

  const moveChatToTop = (
    chatId: string,
    newMessage: any,
    updatedUnseenCount = true
  ) => {
    setChats((prev) => {
      if (!prev) return null;

      const updatedChats = [...prev];
      const chatIndex = updatedChats.findIndex(
        (chat) => chat.chat._id === chatId
      );

      if (chatIndex !== -1) {
        const [moveChat] = updatedChats.splice(chatIndex, 1);

        const updatedChat = {
          ...moveChat,
          chat: {
            ...moveChat.chat,
            latestMessage: {
              text: newMessage.text,
              sender: newMessage.sender,
            },
            updatedAt: new Date().toString(),
            unseenCount:
              updatedUnseenCount && newMessage.sender !== loggedInUser?._id
                ? (moveChat.chat.unseenCount || 0) + 1
                : moveChat.chat.unseenCount || 0,
          },
        };

        updatedChats.unshift(updatedChat);
      }
      return updatedChats;
    });
  };

  const resetUnseenCount = (chatId: string) => {
    setChats((prev) => {
      if (!prev) return null;

      return prev.map((chat) => {
        if (chat.chat._id === chatId) {
          return {
            ...chat,
            chat: {
              ...chat.chat,
              unseenCount: 0,
            },
          };
        }
        return chat;
      });
    });
  };

  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/api/v1/chat/new`,
        {
          userId: loggedInUser?._id,
          otherUserId: u._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedUser(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to start Chat");
    }
  }

  useEffect(() => {
    if (!socket) return;

    const handleMessageSeen = ({
      chatId,
      seenBy,
      messageIds,
    }: {
      chatId: string;
      seenBy: string;
      messageIds?: string[];
    }) => {
      if (!messageIds || !Array.isArray(messageIds)) return;

      if (chatId === selectedUser && loggedInUser) {
        setMessages(
          (prev) =>
            prev?.map((msg) =>
              messageIds.includes(msg._id) && msg.senderId === loggedInUser._id
                ? { ...msg, seen: true }
                : msg
            ) ?? null
        );
      }
    };

    socket.on("messageSeen", handleMessageSeen);

    return () => {
      socket.off("messageSeen", handleMessageSeen);
    };
  }, [socket, selectedUser, loggedInUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchChat();
    }
  }, [selectedUser]);

  const handleMessageSend = async (e: any, imageFile?: File | null) => {
    e.preventDefault();

    if (!message.trim() && !imageFile) return;
    if (!selectedUser) return;

    const token = Cookies.get("token");

    try {
      const formData = new FormData();
      formData.append("chatId", selectedUser);

      // Add text if it exists
      if (message.trim()) {
        formData.append("text", message);
      }

      // Add image if it exists
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some(
          (msg) => msg._id === data.message._id
        );

        if (!messageExists) {
          return [...currentMessages, data.message];
        }

        return currentMessages;
      });
      moveChatToTop(data.message.chatId, message, false);
      setMessage("");

      const displayText = imageFile ? "📷 image" : message;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!selectedUser || !socket) return;

    // Clear existing timeout
    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
    }

    if (value.trim()) {
      // User is typing
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
      console.log(`Emitting typing event for chat: ${selectedUser}`);

      // Set new timeout to stop typing after 2 seconds
      const timeout = setTimeout(() => {
        socket.emit("stopTyping", {
          chatId: selectedUser,
          userId: loggedInUser?._id,
        });
        console.log(`Auto-stopping typing for chat: ${selectedUser}`);
      }, 2000);

      setTypingTimeOut(timeout);
    } else {
      // User stopped typing (empty input)
      socket.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
      console.log(`Stopping typing for chat: ${selectedUser}`);
      setTypingTimeOut(null);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      console.log("Received new message:", message);
      if (selectedUser === message.chatId) {
        setMessages((prev) => {
          const currentMessages = prev || [];
          const exists = currentMessages.some((msg) => msg._id === message._id);
          return exists ? currentMessages : [...currentMessages, message];
        });
      }
      moveChatToTop(message.chatId, message);
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleUserTyping = (data: any) => {
      console.log("Received user typing event:", data);
      socket?.on("newMessage", (message) => {
        console.log("Recieved new message:", message);

        // if (selectedUser === message.chatId) {
        //   setMessages((prev) => {
        //     const currentMessages = prev || [];
        //     const messageExists = currentMessages.some(
        //       (msg:any) => msg._id === message._id
        //     );
        //     if()
        //   });
        // }
      });
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data: any) => {
      console.log("Received user stop typing event:", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(false);
      }
    };

    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);

    return () => {
      socket?.off("userTyping", handleUserTyping);
      socket?.off("messageSeen");
      socket?.off("userStopTyping", handleUserStopTyping);
      socket?.off("newMessage");
    };
  }, [socket, selectedUser, loggedInUser?._id, setChats]);

  useEffect(() => {
    if (selectedUser && socket && messages && loggedInUser) {
      // Get all messages from other user that are not yet seen
      const unseenMessages = messages.filter(
        (msg) => !msg.seen && msg.senderId !== loggedInUser._id
      );

      const unseenMessageIds = unseenMessages.map((msg) => msg._id);

      if (unseenMessageIds.length > 0) {
        socket.on("messageSeen", (data) => {
          if (selectedUser === data.chatId) {
            setMessages((prev) => {
              if (!prev) return null;
              return prev.map((msg) => {
                if (
                  msg.sender === loggedInUser?._id &&
                  data.messageIds &&
                  data.messageIds.includes(msg._id)
                ) {
                  return {
                    ...msg,
                    seen: true,
                    seenAt: new Date().toISOString(),
                  };
                } else if (
                  msg.sender === loggedInUser?._id &&
                  !data.messageIds
                ) {
                  return {
                    ...msg,
                    seen: true,
                    seenAt: new Date().toISOString(),
                  };
                }
                return msg;
              });
            });
          }
        });
      }
    }
  }, [selectedUser, socket, messages, loggedInUser]);

  useEffect(() => {
    if (selectedUser && socket) {
      // Clean up previous chat
      setMessages(null);
      setUser(null);
      setIsTyping(false);
      resetUnseenCount(selectedUser);

      // Join new chat room
      socket.emit("joinChat", selectedUser);
      console.log(`Joining chat room: ${selectedUser}`);
      socket.emit("messageSeen", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
      // Fetch chat data
      fetchChat();

      return () => {
        // Leave chat room when component unmounts or selectedUser changes
        socket.emit("leaveChat", selectedUser);
        console.log(`Leaving chat room: ${selectedUser}`);

        // Clear typing timeout
        if (typingTimeOut) {
          clearTimeout(typingTimeOut);
          setTypingTimeOut(null);
        }
      };
    }
  }, [selectedUser, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeOut) {
        clearTimeout(typingTimeOut);
      }
    };
  }, [typingTimeOut]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <Chatsidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        createChat={createChat}
        onlineUsers={onlineUsers}
      />

      <div className="flex-1 flex flex-col justify-between p-4 backdrop:blur-xl bg-white/5 border-1 border-white/10">
        <ChatHeader
          user={user}
          setSidebarOpen={setSidebarOpen}
          isTyping={isTyping}
          onlineUsers={onlineUsers}
        />

        <ChatMessages
          selectedUser={selectedUser}
          messages={messages}
          loggedInUser={loggedInUser}
        />
        <MessageInput
          selectedUser={selectedUser}
          message={message}
          setMessage={handleTyping}
          handleMessageSend={handleMessageSend}
        />
      </div>
    </div>
  );
};

export default chatApp;
