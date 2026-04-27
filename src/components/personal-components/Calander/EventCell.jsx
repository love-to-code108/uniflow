"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react"; 
import { getBadgeDetails } from "@/actions/calendar"; 

const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const EventCell = ({ item, isPast }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deepDetails, setDeepDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleEventClick = (e) => {
        e.stopPropagation(); 
        setIsDialogOpen(true);
    };

    useEffect(() => {
        if (isDialogOpen && !deepDetails) {
            const fetchDetails = async () => {
                setIsLoading(true);
                const response = await getBadgeDetails(item.id, item.type);
                if (response.status === "SUCCESS") {
                    setDeepDetails(response.data);
                }
                setIsLoading(false);
            };
            fetchDetails();
        }
    }, [isDialogOpen, item.id, item.type, deepDetails]);

    const getColors = () => {
        if (item.status === "pending") return "bg-[#B8B8B8] text-black";
        if (item.type === "event") return isPast ? "bg-[#040071] text-white" : "bg-[#0802C0] text-white";
        if (item.type === "vehicle") return isPast ? "bg-[#1D7930] text-white" : "bg-[#25973D] text-white";
        if (item.type === "guest") return isPast ? "bg-[#693319] text-white" : "bg-[#974B25] text-white";
        return "bg-gray-200 text-gray-800";
    };

    const renderContent = () => {
        // Guest Badges (No time needed)
        if (item.type === "guest") {
            return <span className="truncate font-semibold">{truncateText(item.title, 20)}</span>;
        }

        // Event & Vehicle Badges (Forgiving time logic - fixes Issue 1)
        const timeString = item.startTime 
            ? `${item.startTime}${item.endTime ? `-${item.endTime}` : ''}` 
            : (item.time || "");

        return (
            <>
                <span className="truncate mr-2 font-semibold">{truncateText(item.title, 12)}</span>
                <span className="opacity-90 shrink-0 whitespace-nowrap text-[10px] leading-tight">{timeString}</span>
            </>
        );
    };

    return (
        <>
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
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
                        <DialogDescription>Review the requested details below.</DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 py-4">
                        {/* Always visible base data */}
                        <div className="grid grid-cols-4 items-start gap-4 border-b pb-2">
                            <span className="font-semibold text-right text-sm text-muted-foreground">Title:</span>
                            <span className="col-span-3 font-medium text-sm">{item.title}</span>
                        </div>

                        {/* --- LAZY LOADED DATA AREA --- */}
                        {isLoading ? (
                            <div className="flex justify-center items-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : deepDetails ? (
                            <>
                                {/* Requester */}
                                <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                    <span className="font-semibold text-right text-sm text-muted-foreground">Requester:</span>
                                    <span className="col-span-3 font-medium text-sm">
                                        {deepDetails.user?.name || deepDetails.user?.username || "Unknown"}
                                    </span>
                                </div>

                                {/* Date(s) - Fixes Issues 3 & 4 */}
                                <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                    <span className="font-semibold text-right text-sm text-muted-foreground">Date:</span>
                                    <span className="col-span-3 font-medium text-sm">
                                        {item.type === "guest" 
                                            ? `${new Date(deepDetails.checkInDate).toLocaleDateString()} to ${new Date(deepDetails.checkOutDate).toLocaleDateString()}`
                                            : new Date(deepDetails.date).toLocaleDateString()
                                        }
                                    </span>
                                </div>

                                {/* Precise Times - Fixes Issue 2 */}
                                {item.type !== "guest" && (
                                    <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                        <span className="font-semibold text-right text-sm text-muted-foreground">Time:</span>
                                        <span className="col-span-3 font-medium text-sm">
                                            {deepDetails.startTime || item.startTime} - {deepDetails.endTime || item.endTime || "TBD"}
                                        </span>
                                    </div>
                                )}

                                {/* Event Specific */}
                                {item.type === "event" && deepDetails.description && (
                                    <div className="grid grid-cols-4 items-start gap-4 border-b pb-2">
                                        <span className="font-semibold text-right text-sm text-muted-foreground">Details:</span>
                                        <span className="col-span-3 text-sm whitespace-pre-wrap">{deepDetails.description}</span>
                                    </div>
                                )}

                                {/* Vehicle Specific */}
                                {item.type === "vehicle" && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                            <span className="font-semibold text-right text-sm text-muted-foreground">Destination:</span>
                                            <span className="col-span-3 font-medium text-sm">{deepDetails.destination}</span>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                            <span className="font-semibold text-right text-sm text-muted-foreground">Purpose:</span>
                                            <span className="col-span-3 font-medium text-sm">{deepDetails.purpose}</span>
                                        </div>
                                    </>
                                )}

                                {/* Guest Specific */}
                                {item.type === "guest" && (
                                    <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                        <span className="font-semibold text-right text-sm text-muted-foreground">Purpose:</span>
                                        <span className="col-span-3 font-medium text-sm">{deepDetails.purpose}</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-center text-red-500 py-4">Failed to load details.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default EventCell;