import React, { createContext, useContext, useEffect, useState } from "react";

interface Message {
  text: string;
  time: string;
  isUser: boolean;
}

interface Reminder {
  date: string;
  notes: string[];
}

interface ChatContextProps {
  messages: Message[];
  addMessage: (msg: Message) => void;
  reminders: Record<string, Reminder>;
  addReminderFromAI: (reminder: Reminder) => void;
  setRemindersFromStorage: (reminders: Record<string, Reminder>) => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState<Record<string, Reminder>>(() => {
    const saved = localStorage.getItem("calendar_reminders");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("calendar_reminders", JSON.stringify(reminders));
  }, [reminders]);

  const addMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);

  const addReminderFromAI = (reminder: Reminder) => {
    setReminders((prev) => ({
      ...prev,
      [reminder.date]: {
        date: reminder.date,
        notes: [...(prev[reminder.date]?.notes || []), ...reminder.notes],
      },
    }));
  };

  const setRemindersFromStorage = (r: Record<string, Reminder>) => {
    setReminders((prev) => {
      const prevStr = JSON.stringify(prev);
      const newStr = JSON.stringify(r);
      return prevStr === newStr ? prev : r;
    });
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        addMessage,
        reminders,
        addReminderFromAI,
        setRemindersFromStorage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};
