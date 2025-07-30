import { Message } from "@/app/chat/page";
import { User } from "@/context/AppContext";
import { Check, CheckCheck } from "lucide-react";
import moment from "moment";
import React, { useEffect, useMemo, useRef } from "react";

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Remove duplicate messages
  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set();
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages]);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2 custom-scroll">
        {!selectedUser ? (
          <p className="text-gray-400 text-center mt-20">
            Please Select a User start a chatting 📩
          </p>
        ) : (
          <>
            {uniqueMessages.map((e, i) => {
              const isSentByMe = e.sender === loggedInUser?._id;
              const uniqueKey = `${e._id}-${i}`;

              return (
                <div
                  className={`flex w-full ${
                    isSentByMe ? "justify-end" : "justify-start"
                  }`}
                  key={uniqueKey}
                >
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    <div
                      className={`rounded-lg p-3 w-fit ${
                        isSentByMe
                          ? "bg-blue-600 text-white ml-auto"
                          : "bg-gray-700 text-white mr-auto"
                      }`}
                    >
                      {e.messageType === "image" && e.image && (
                        <div className="relative group">
                          <img
                            src={e.image.url}
                            alt="shared image"
                            className="max-w-full h-auto rounded-lg"
                          />
                        </div>
                      )}
                      {e.text && <p className="mt-1">{e.text}</p>}
                    </div>
                    
                    <div
                      className={`flex items-center gap-1 text-xs text-gray-400 ${
                        isSentByMe 
                          ? "justify-end pr-2" 
                          : "justify-start pl-2"
                      }`}
                    >
                      {isSentByMe ? (
                        // For messages sent by me - show timestamp and tick marks
                        <div className="flex items-center gap-1">
                          <span>
                            {moment(e.createdAt).format("hh:mm A . MMM D")}
                          </span>
                          <div className="flex items-center ml-1">
                            {e.seen ? (
                              <div className="flex items-center gap-1 text-blue-400">
                                <CheckCheck className="w-3 h-3" />
                                {e.seenAt && (
                                  <span>{moment(e.seenAt).format("hh:mm A")}</span>
                                )}
                              </div>
                            ) : (
                              <Check className="w-3 h-3 text-gray-500" />
                            )}
                          </div>
                        </div>
                      ) : (
                        // For messages received from others - only show timestamp
                        <span>
                          {moment(e.createdAt).format("hh:mm A . MMM D")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;