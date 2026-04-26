import { create } from "zustand";
import { persist } from "zustand/middleware"; // 1. Import the persist middleware

const now = new Date()

// 2. Wrap your auth store with the persist function
export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            login: (userData) => set({ user: userData }),
            logout: () => set({ user: null }),
        }),
        {
            name: "uniflow-auth", // 3. This is the unique key used in localStorage
        }
    )
);

// Your calendar store stays exactly the same! 
// (We don't need to persist the calendar date across refreshes)
export const calanderStore = create((set) => ({
    month: now.getMonth(), // 0-indexed (0 = Jan, 11 = Dec)
    year: now.getFullYear(),

    nextMonth: () => set((state) => {
        console.log("working")
        const nextDate = new Date(state.year, state.month + 1, 1);
        return {
            month: nextDate.getMonth(),
            year: nextDate.getFullYear()
        };
    }),

    prevMonth: () => set((state) => {
        const prevDate = new Date(state.year, state.month - 1, 1);
        return {
            month: prevDate.getMonth(),
            year: prevDate.getFullYear()
        };
    }),
}))