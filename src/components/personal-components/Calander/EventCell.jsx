"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const EventCell = ({ item, isPast }) => {
    // 1. State to control this specific badge's detailed dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleEventClick = (e) => {
        e.stopPropagation(); // Prevents the background cell from opening the "Create" form
        setIsDialogOpen(true);
    };

    const getColors = () => {
        if (item.status === "pending") {
            return "bg-[#B8B8B8] text-black";
        }
        if (item.type === "event") {
            return isPast ? "bg-[#040071] text-white" : "bg-[#0802C0] text-white";
        }
        if (item.type === "vehicle") {
            return isPast ? "bg-[#1D7930] text-white" : "bg-[#25973D] text-white";
        }
        if (item.type === "guest") {
            return isPast ? "bg-[#693319] text-white" : "bg-[#974B25] text-white";
        }
        return "bg-gray-200 text-gray-800";
    };

    const renderContent = () => {
        if (item.type === "guest") {
            return (
                <span className="truncate font-semibold">
                    {truncateText(item.title, 20)}
                </span>
            );
        }

        const timeString = (item.startTime && item.endTime)
            ? `${item.startTime}-${item.endTime}`
            : item.time;

        return (
            <>
                <span className="truncate mr-2 font-semibold">
                    {truncateText(item.title, 12)}
                </span>
                <span className="opacity-90 shrink-0 whitespace-nowrap text-[10px] leading-tight">
                    {timeString}
                </span>
            </>
        );
    };

    return (
        <>
            {/* THE VISUAL BADGE */}
            <div
                onClick={handleEventClick}
                className={cn(
                    "w-full px-2 py-1 text-xs rounded transition-colors cursor-pointer flex justify-between items-center font-medium shadow-sm",
                    getColors()
                )}
                title={item.title}
            >
                {renderContent()}
            </div>

            {/* THE DETAILED DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="capitalize text-xl flex items-center gap-3">
                            {item.type} Details
                            <span className={cn(
                                "text-[10px] px-2 py-1 rounded-full text-white font-medium uppercase tracking-wider",
                                item.status === "pending" ? "bg-gray-500" : "bg-[#36EA5C]"
                            )}>
                                {item.status}
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            Review the requested details below.
                        </DialogDescription>
                    </DialogHeader>

                    {/* DATA DISPLAY SHELL */}
                    <div className="flex flex-col gap-3 py-4">
                        <div className="grid grid-cols-4 items-start gap-4 border-b pb-2">
                            <span className="font-semibold text-right text-sm text-muted-foreground">Title:</span>
                            <span className="col-span-3 font-medium text-sm">{item.title}</span>
                        </div>
                        
                        {item.type !== "guest" && (
                            <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                <span className="font-semibold text-right text-sm text-muted-foreground">Time:</span>
                                <span className="col-span-3 font-medium text-sm">{item.startTime} - {item.endTime}</span>
                            </div>
                        )}

                        {/* TEMPORARY PLACEHOLDER FOR DEEP DETAILS */}
                        <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-sm text-center text-muted-foreground mt-2">
                            Deep details (Description, Purpose, Destination, Requester) will load here.
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default EventCell;