import React, { useState, useEffect, useRef } from "react";
import "./ChatBot.css";
import { getAIResponse } from "../../../utils/gemini";
import { useChat } from "../../../context/ChatContext";
import ReactMarkdown from "react-markdown";
import * as chrono from "chrono-node";
import { handleFinanceMessage } from "../../../utils/aiFinanceParser";

interface PendingReminder {
  text: string;
  date: string;
}

export const ChatBot: React.FC = () => {
  const { messages, addMessage, addReminderFromAI } = useChat();
  const [input, setInput] = useState("");
  const [pendingReminder, setPendingReminder] =
    useState<PendingReminder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTime = (): string => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const parseDateFromText = (text: string): string | null => {
    const parsedDate = chrono.parseDate(text);
    return parsedDate ? parsedDate.toISOString().split("T")[0] : null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { text: input, time: getTime(), isUser: true };
    addMessage(userMsg);
    setInput("");

    // 👉 Тут про гроші
    const financeResult = await handleFinanceMessage(input);
    if (financeResult && !financeResult.startsWith("Не вдалося")) {
      const botMsg = { text: financeResult, time: getTime(), isUser: false };
      addMessage(botMsg);
      return;
    }

    // 👉 Відповідь на питання про нагадування
    if (pendingReminder && input.trim().toLowerCase() === "так") {
      addReminderFromAI({
        date: pendingReminder.date,
        notes: [pendingReminder.text],
      });

      const confirmedMsg = {
        text: `✅ Нагадування на ${pendingReminder.date} додано: ${pendingReminder.text}`,
        time: getTime(),
        isUser: false,
      };
      addMessage(confirmedMsg);
      setPendingReminder(null);
      return;
    }

    if (pendingReminder && input.trim().toLowerCase() === "ні") {
      const skipMsg = {
        text: "Добре, не ставлю нагадування.",
        time: getTime(),
        isUser: false,
      };
      addMessage(skipMsg);
      setPendingReminder(null);
      return;
    }

    // Отримуємо відповідь від AI
    const history = [...messages, userMsg].map((m) => ({
      role: m.isUser ? "user" : "model",
      parts: [m.text],
    }));

    const replyText = await getAIResponse(history);
    const botMsg = { text: replyText, time: getTime(), isUser: false };
    addMessage(botMsg);

    // 👉 Якщо в запиті є дата чи фінансова дія — зберігаємо очікування підтвердження
    const detectedDate = parseDateFromText(userMsg.text);
    if (
      detectedDate &&
      replyText.includes("Хочете, щоб я поставив нагадування")
    ) {
      setPendingReminder({
        text: userMsg.text,
        date: detectedDate,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="chat-wrapper">
      <div className="chat">
        <header className="chat__header">
          <h2 className="chat__title">AI-бухгалтер</h2>
        </header>

        <div className="chat__messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.isUser ? "message--user" : "message--bot"
              }`}
            >
              <div className="message__text">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              <span className="message__time">{msg.time}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="chat__input-area">
          <input
            className="chat__input"
            type="text"
            placeholder="Напишіть ваше питання..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button onClick={handleSend} className="chat__button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-send-icon lucide-send"
            >
              <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
              <path d="m21.854 2.147-10.94 10.939" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
