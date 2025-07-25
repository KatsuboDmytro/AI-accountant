import { GoogleGenerativeAI } from "@google/generative-ai";
import * as chrono from "chrono-node";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

function addReminderToCalendar(reminder: string, dateStr: string) {
  const stored = JSON.parse(localStorage.getItem("calendar_reminders") || "{}");
  const existingNotes = stored[dateStr]?.notes || [];

  const updated = {
    ...stored,
    [dateStr]: {
      date: dateStr,
      notes: [...existingNotes, reminder],
    },
  };

  localStorage.setItem("calendar_reminders", JSON.stringify(updated));
}

export async function getAIResponse(
  chatHistory: { role: string; parts: string[] }[]
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

  const systemPrompt = `Ти — віртуальний бухгалтер-консультант для українських ФОПів, інтегрований у вебдодаток з календарем.
Сьогодні: ${todayStr}

Коли користувач просить створити нагадування — поверни об’єкт формату:

{ "reminder": "текст нагадування", "date": "2025-07-25" }

У відповідь додай повідомлення:
"Нагадування додано в календар на 25.07.2025".`;

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      ...chatHistory.map((msg) => ({
        role: msg.role,
        parts: msg.parts.map((part) => ({ text: part })),
      })),
    ],
  });

  const lastUserMessage = chatHistory[chatHistory.length - 1].parts[0];
  const result = await chat.sendMessage(lastUserMessage);
  const response = result.response.text();

  // Спроба знайти JSON-нагадування
  try {
    const match = response.match(/\{[^}]+\}/);
    if (match) {
      const reminderData = JSON.parse(match[0]);

      if (reminderData?.reminder && reminderData?.date) {
        const isoDate = new Date(reminderData.date).toISOString().split("T")[0];
        addReminderToCalendar(reminderData.reminder, isoDate);

        const localizedDate = new Date(isoDate).toLocaleDateString("uk-UA", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        return (
          `Нагадування додано в календар на ${localizedDate}.\n\n` +
          reminderData.reminder
        );
      }
    }
  } catch (err) {
    console.warn("AI не повернув правильний формат нагадування:", err);
  }

  // Якщо AI не зміг — самостійно шукаємо дату через chrono
  const parsed = chrono.parse(lastUserMessage, today)[0];

  if (parsed) {
    const dateObj = parsed.start.date();
    const isoDate = dateObj.toISOString().split("T")[0];
    const reminder = lastUserMessage.replace(parsed.text, "").trim();

    addReminderToCalendar(reminder, isoDate);

    const localizedDate = dateObj.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return (
      `Нагадування додано в календар на ${localizedDate}.\n\n` +
      (reminder || parsed.text)
    );
  }

  return response;
}
