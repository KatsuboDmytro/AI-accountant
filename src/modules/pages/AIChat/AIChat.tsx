import { ChatProvider } from "../../../context/ChatContext";
import { ChatBot, Calendar, IncomeBook } from "../../index";
import "./aiChat.css";

export const AIChat = () => {
  return (
    <ChatProvider>
      <div className="ai-chat-container">
        <Calendar />
        <ChatBot />
        <IncomeBook isVATpayer={false} />
      </div>
    </ChatProvider>
  );
};
