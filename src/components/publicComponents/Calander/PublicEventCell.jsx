"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

const PublicEventCell = ({ item, isPast }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleEventClick = (e) => {
        e.stopPropagation();
        setIsDialogOpen(true);
    };

    const bgColor = isPast ? "bg-[#040071]" : "bg-[#0802C0]";
    const timeString = item.startTime ? `${item.startTime}${item.endTime ? `-${item.endTime}` : ''}` : "";

    return (
        <>
            <div
                onClick={handleEventClick}
                className={cn(
                    "w-full px-2 py-1 text-xs rounded transition-colors cursor-pointer flex justify-between items-center font-medium shadow-sm text-white",
                    bgColor
                )}
            >
                <span className="truncate mr-2 font-semibold">{truncateText(item.title, 12)}</span>
                <span className="opacity-90 shrink-0 whitespace-nowrap text-[10px] leading-tight">{timeString}</span>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-primary">{item.title}</DialogTitle>
                        <DialogDescription>
                            {new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                        <div className="grid grid-cols-3 items-center border-b pb-2">
                            <span className="font-semibold text-sm text-muted-foreground">Time:</span>
                            <span className="col-span-2 text-sm font-medium">{item.startTime} - {item.endTime}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center border-b pb-2">
                            <span className="font-semibold text-sm text-muted-foreground">Venue:</span>
                            <span className="col-span-2 text-sm font-medium">{item.venue || "TBA"}</span>
                        </div>

                        {item.description && (
                            <div className="flex flex-col gap-1 mt-2">
                                <span className="font-semibold text-sm text-muted-foreground">About:</span>
                                <div className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap">
                                    {item.description}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Show Registration button ONLY if link exists AND event is not in the past */}
                    {item.registrationLink && !isPast && (
                        <div className="w-full mt-2">
                            <a href={item.registrationLink} target="_blank" rel="noopener noreferrer" className="w-full block">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                    Register Now
                                </Button>
                            </a>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PublicEventCell;