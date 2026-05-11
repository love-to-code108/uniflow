import { create } from "zustand";
import { persist } from "zustand/middleware"; 

const now = new Date()

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            login: (userData) => set({ user: userData }),
            logout: () => set({ user: null }),
        }),
        {
            name: "uniflow-auth", 
        }
    )
);

export const calanderStore = create((set) => ({
    month: now.getMonth(), 
    year: now.getFullYear(),

    // --- NEW: The Global Refresh Trigger ---
    refreshTrigger: 0,
    incrementRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
    // ---------------------------------------

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



export const useAppStore = create((set) => ({
    currentView: "calendar", // "calendar" or "action-center"
    setCurrentView: (view) => set({ currentView: view }),
}));