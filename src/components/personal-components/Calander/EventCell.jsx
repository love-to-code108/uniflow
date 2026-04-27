"use client";

import React from "react";
import { cn } from "@/lib/utils";

const EventCell = ({ item, isPast }) => {

    const handleEventClick = (e) => {
        e.stopPropagation();
        // This will open our detailed dialog in the next step!
        console.log("Opening details for:", item.title);
    };

    // --- NEW: Figma Exact Hex Code Mapping ---
    const getColors = () => {
        if (item.type === "event") {
            return isPast 
                ? "bg-[#245DA8] text-[#040071]" 
                : "bg-[#3485F0] text-[#0802C0]";
        }
        if (item.type === "vehicle") {
            return isPast 
                ? "bg-[#21993A] text-[#1D7930]" 
                : "bg-[#36EA5C] text-[#25973D]";
        }
        if (item.type === "guest") {
            return isPast 
                ? "bg-[#9C4F28] text-[#693319]" 
                : "bg-[#EB773D] text-[#974B25]";
        }
        // Fallback just in case
        return "bg-gray-200 text-gray-800";
    };

    return (
        <div
            onClick={handleEventClick}
            className={cn(
                "w-full px-2 py-1 text-xs rounded transition-colors cursor-pointer truncate flex justify-between items-center font-medium",
                getColors()
            )}
            title={`${item.title} - ${item.time}`}
        >
            <span className="truncate mr-2 font-semibold">{item.title}</span>
            <span className="opacity-90 shrink-0 whitespace-nowrap">{item.time}</span>
        </div>
    );
}

export default EventCell;