import React, { useState, useEffect, useRef, useMemo } from "react";
import "./Calendar.css";
import { useChat } from "../../../context/ChatContext";

export const Calendar: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reminderInput, setReminderInput] = useState("");
  const { reminders, setRemindersFromStorage, addReminderFromAI } = useChat();

  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  const months = [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень",
  ];

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayLabel = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
  };

  const isToday = (date: Date): boolean => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const isSelected = (dateStr: string): boolean => {
    if (selectedDates.length === 1) return selectedDates[0] === dateStr;
    if (selectedDates.length === 2) {
      return dateStr >= selectedDates[0] && dateStr <= selectedDates[1];
    }
    return false;
  };

  const handleDateClick = (dateStr: string) => {
    if (selectedDates.length === 1 && selectedDates[0] === dateStr) {
      setSelectedDates([]);
    } else if (selectedDates.length === 0 || selectedDates.length === 2) {
      setSelectedDates([dateStr]);
    } else if (selectedDates.length === 1) {
      const [first] = selectedDates;
      const range = [first, dateStr].sort();
      setSelectedDates(range);
    }
  };

  useEffect(() => {
    const currentMonthIndex = today.getMonth();
    const currentMonthRef = monthRefs.current[currentMonthIndex];
    currentMonthRef?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [today]);

  useEffect(() => {
    const stored = localStorage.getItem("calendar_reminders");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRemindersFromStorage(parsed);
      } catch (err) {
        console.error("Failed to parse reminders", err);
      }
    }
  }, [setRemindersFromStorage]);
  //постав нагадування сьогодні заплатити податки

  const addReminder = () => {
    if (selectedDates.length === 0 || !reminderInput.trim()) return;
    for (const dateStr of selectedDates) {
      addReminderFromAI({ date: dateStr, notes: [reminderInput.trim()] });
    }
    setReminderInput("");
  };

  return (
    <section>
      <div className="calendar">
        <div className="calendar__header">
          <button
            className="calendar__nav-button"
            onClick={() => setYear(year - 1)}
          >
            &laquo;
          </button>
          <h2 className="calendar__title">{year}</h2>
          <button
            className="calendar__nav-button"
            onClick={() => setYear(year + 1)}
          >
            &raquo;
          </button>
        </div>
        <div className="calendar__months">
          {months.map((month, mIdx) => {
            return (
              <div
                key={month}
                className={`calendar__month`}
                ref={(el) => {
                  monthRefs.current[mIdx] = el;
                }}
              >
                <div className="month__header">{month}</div>
                <div className="month__weekdays">
                  {weekDays.map((d) => (
                    <div key={d} className="day__weekday">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="month__days">
                  {[...Array(getDaysInMonth(mIdx, year))].map((_, dIdx) => {
                    const date = new Date(year, mIdx, dIdx + 1);
                    const dateStr = getDayLabel(date);
                    const selected = isSelected(dateStr);
                    const hasReminder = reminders[dateStr]?.notes.length > 0;
                    return (
                      <div
                        key={dateStr}
                        className={`day${isToday(date) ? " day--today" : ""}${
                          selected ? " day--selected" : ""
                        }${hasReminder ? " day--has-reminder" : ""}`}
                        onClick={() => handleDateClick(dateStr)}
                      >
                        {dIdx + 1}
                        {hasReminder && <div className="day__dot"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedDates.length >= 1 && (
        <div className="calendar__reminders">
          <h3 className="reminders__title">
            Нагадування на {selectedDates[0]}
          </h3>
          <ul className="reminders__list">
            {reminders[selectedDates[0]]?.notes?.map(
              (notes: string, idx: number) => <li key={idx}>{notes}</li>
            ) || <li>Немає нагадувань</li>}
          </ul>
          <div className="reminders__form">
            <input
              type="text"
              className="reminders__input"
              value={reminderInput}
              onChange={(e) => setReminderInput(e.target.value)}
              placeholder="Нове нагадування"
            />
            <button className="reminders__button" onClick={addReminder}>
              +
            </button>
          </div>
        </div>
      )}
    </section>
  );
};