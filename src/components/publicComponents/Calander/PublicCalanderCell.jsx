"use client";

import React from "react";
import PublicEventCell from "./PublicEventCell";

const PublicCalanderCell = ({ value, dayData = [] }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(value.year, value.month - 1, value.day);
    const isPast = cellDate < today;

    return (
        <div className="relative flex flex-col w-full min-h-[160px] border-r-[1px] border-b-[1px] border-border p-2 bg-background">
            {/* Day Number */}
            <div className="relative z-10 w-full flex justify-end mb-1 pointer-events-none">
                {value.isToday ? (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FF542D] text-white font-bold shadow-sm">
                        {value.day}
                    </div>
                ) : (
                    <p className={value.isCurrentMonth ? "text-foreground font-medium" : "text-muted-foreground opacity-40"}>
                        {value.day}
                    </p>
                )}
            </div>

            {/* Events Container */}
            <div className="relative z-10 flex flex-col gap-1 w-full mt-1 overflow-y-auto">
                {dayData.map((item, idx) => (
                    <PublicEventCell key={`${item.id}-${idx}`} item={item} isPast={isPast} />
                ))}
            </div>
        </div>
    );
};

export default PublicCalanderCell;