import { create } from "zustand";
const now = new Date()



export const useAuthStore = create((set) => ({
    user: null,
    login: (userData) => set({ user: userData }),
    logout: () => set({ user: null }),
}));


export const calanderStore = create((set) => ({
    month: now.getMonth(), // 0-indexed (0 = Jan, 11 = Dec)
    year: now.getFullYear(),

    nextMonth: () => set((state) => {
        // If current is 11 (Dec), this becomes 12. 
        // New Date(year, 12) automatically rolls over to Jan of next year.
        console.log("working")
        const nextDate = new Date(state.year, state.month + 1, 1);
        return {
            month: nextDate.getMonth(),
            year: nextDate.getFullYear()
        };
    }),

    prevMonth: () => set((state) => {
        // New Date(year, -1) automatically rolls back to Dec of previous year.
        const prevDate = new Date(state.year, state.month - 1, 1);
        return {
            month: prevDate.getMonth(),
            year: prevDate.getFullYear()
        };
    }),

    // This is a "Selector" or "Computed" property
    // getMonthName: () => {
    //     const { month, year } = get();
    //     return new Date(year, month).toLocaleString('default', { month: 'long' });
    // },
}))



