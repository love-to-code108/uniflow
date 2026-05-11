"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useAuthStore, calanderStore } from "@/store/globalStates";
import { getAllVehicles } from "@/actions/vehicles";

// --- SHADCN UI IMPORTS ---
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { getBadgeDetails, updateBadgeDetails, resolveBadgeStatus, getAllVenues } from "@/actions/calendar";
import { toast } from "sonner";

const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// Replicating your time slots for the edit dropdowns
const timeSlots = [
    { label: "9:30 AM", value: "09:30" },
    { label: "10:00 AM", value: "10:00" },
    { label: "10:30 AM", value: "10:30" },
    { label: "11:00 AM", value: "11:00" },
    { label: "11:30 AM", value: "11:30" },
    { label: "12:00 PM", value: "12:00" },
    { label: "12:30 PM", value: "12:30" },
    { label: "1:30 PM", value: "13:30" },
    { label: "2:00 PM", value: "14:00" },
    { label: "2:30 PM", value: "14:30" },
    { label: "3:00 PM", value: "15:00" },
    { label: "3:30 PM", value: "15:30" },
    { label: "4:00 PM", value: "16:00" },
    { label: "4:30 PM", value: "16:30" },
];

const EventCell = ({ item, isPast }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deepDetails, setDeepDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isApproveAlertOpen, setIsApproveAlertOpen] = useState(false);

    // --- Edit State & Auth Store ---
    const user = useAuthStore((state) => state.user);
    const incrementRefresh = calanderStore((state) => state.incrementRefresh);
    const [isEditing, setIsEditing] = useState(false);
    const [venuesList, setVenuesList] = useState([]);
    const [vehiclesList, setVehiclesList] = useState([]);
    const [editForm, setEditForm] = useState({});

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

                // --- NEW: Fetch dynamic venues if it is an event ---
                if (item.type === "event") {
                    const vRes = await getAllVenues();
                    if (vRes.status === "SUCCESS") {
                        setVenuesList(vRes.data);
                    }
                }
                // ---------------------------------------------------


                // --- NEW: Fetch dynamic vehicles if it is a vehicle request ---
                if (item.type === "vehicle") {
                    const vehRes = await getAllVehicles();
                    if (vehRes.status === "SUCCESS") {
                        setVehiclesList(vehRes.data);
                    }
                }
                // ---------------------------------------------------

                setIsLoading(false);
            };
            fetchDetails();
        }
    }, [isDialogOpen, item.id, item.type, deepDetails]);

    const isCreator = user?.id === deepDetails?.userId;
    const canApprove =
        (item.type === "event" && user?.permissions?.can_approve_events) ||
        (item.type === "vehicle" && user?.permissions?.can_approve_vehicles) ||
        (item.type === "guest" && user?.permissions?.can_approve_guests);

    const canEdit = isCreator || canApprove;

    const canEditSchedule = canApprove || item.status === "pending";

    const handleEditStart = () => {
        setEditForm({
            title: item.title,
            eventDate: deepDetails?.date ? new Date(deepDetails.date) : new Date(),
            checkInDate: deepDetails?.checkInDate ? new Date(deepDetails.checkInDate) : new Date(),
            checkOutDate: deepDetails?.checkOutDate ? new Date(deepDetails.checkOutDate) : new Date(),
            startTime: deepDetails?.startTime || item.startTime || "",
            endTime: deepDetails?.endTime || item.endTime || "",
            description: deepDetails?.description || "",
            destination: deepDetails?.destination || "",
            purpose: deepDetails?.purpose || "",
            // --- NEW: Map the relational ID ---
            venueId: deepDetails?.venue?.id || "",
            vehicleId: deepDetails?.vehicle?.id || "",
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        setIsLoading(true);

        // --- NEW: Apply Safe Date to prevent timezone pollution during edits ---
        let payload = { ...editForm };
        if (item.type === "event" || item.type === "vehicle") {
            payload.eventDate = new Date(editForm.eventDate.getFullYear(), editForm.eventDate.getMonth(), editForm.eventDate.getDate(), 12, 0, 0);
        } else if (item.type === "guest") {
            payload.checkInDate = new Date(editForm.checkInDate.getFullYear(), editForm.checkInDate.getMonth(), editForm.checkInDate.getDate(), 12, 0, 0);
            payload.checkOutDate = new Date(editForm.checkOutDate.getFullYear(), editForm.checkOutDate.getMonth(), editForm.checkOutDate.getDate(), 12, 0, 0);
        }

        const response = await updateBadgeDetails(item.id, item.type, payload);

        if (response.status === "SUCCESS") {
            toast.success("Details updated successfully!");
            setIsEditing(false);
            setDeepDetails(response.data);
            incrementRefresh();
        } else {
            toast.error(response.message);
        }
        setIsLoading(false);
    };

    const handleApprove = async () => {
        setIsLoading(true);
        const response = await resolveBadgeStatus(item.id, item.type, "approved", item.status);

        if (response.status === "SUCCESS") {
            toast.success(`${item.type} request approved!`);
            setDeepDetails(response.data);
            item.status = "approved";
            incrementRefresh();
            setIsApproveAlertOpen(false); // <-- Close dialog on success
        } else {
            toast.error(response.message);
            incrementRefresh();
            setIsApproveAlertOpen(false); // <-- Close dialog on error
        }
        setIsLoading(false);
    };

    const handleDecline = async () => {
        setIsLoading(true);
        const response = await resolveBadgeStatus(item.id, item.type, "declined", item.status);

        if (response.status === "SUCCESS") {
            toast.success(`${item.type} request declined and deleted.`);
            incrementRefresh();
            setIsAlertOpen(false);
            setIsDialogOpen(false);
        } else {
            toast.error(response.message);
            incrementRefresh();
            setIsAlertOpen(false);
        }
        setIsLoading(false);
    };

    const getColors = () => {
        if (item.status === "pending") {
            // --- THE FIX: Priority Requests get the special orange color! ---
            if (item.isPriority) return "bg-[#FF876B] text-black shadow-md border border-[#FF876B]/50";
            return "bg-[#B8B8B8] text-black";
        }
        if (item.type === "event") return isPast ? "bg-[#040071] text-white" : "bg-[#0802C0] text-white";
        if (item.type === "vehicle") return isPast ? "bg-[#1D7930] text-white" : "bg-[#25973D] text-white";
        if (item.type === "guest") return isPast ? "bg-[#693319] text-white" : "bg-[#974B25] text-white";
        return "bg-gray-200 text-gray-800";
    };

    const renderBadgeContent = () => {
        if (item.type === "guest") {
            return <span className="truncate font-semibold">{truncateText(item.title, 20)}</span>;
        }
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availableEndTimes = editForm.startTime
        ? timeSlots.filter(slot => slot.value > editForm.startTime)
        : timeSlots;

    // Helper logic to cleanly format end time
    const displayEndTime = deepDetails?.endTime || item.endTime;
    const timeDisplayString = `${deepDetails?.startTime || item.startTime || "TBD"} ${displayEndTime ? `- ${displayEndTime}` : ""}`;

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
                {renderBadgeContent()}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setIsEditing(false);
            }}>
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
                        <DialogDescription>
                            {isEditing ? "Modify the details below." : "Review the requested details below."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 py-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : deepDetails ? (
                            <>
                                {/* Requester (Never Editable) */}
                                <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                    <span className="font-semibold text-right text-sm text-muted-foreground">Requester:</span>
                                    <span className="col-span-3 font-medium text-sm">
                                        {deepDetails.user?.name || deepDetails.user?.username || "Unknown"}
                                    </span>
                                </div>

                                {/* EDITABLE DATE SECTION */}
                                {item.type === "guest" ? (
                                    <div className="grid grid-cols-4 items-start gap-4 border-b pb-2">
                                        <span className="font-semibold text-right text-sm text-muted-foreground mt-2">Dates:</span>
                                        {isEditing && canEditSchedule ? (
                                            <div className="col-span-3">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-8 text-sm", !editForm.checkInDate && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {editForm.checkInDate ? format(editForm.checkInDate, "PPP") : <span>Check-In</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={editForm.checkInDate} onSelect={(date) => setEditForm({ ...editForm, checkInDate: date })} disabled={(date) => date < today} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-8 text-sm", !editForm.checkOutDate && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {editForm.checkOutDate ? format(editForm.checkOutDate, "PPP") : <span>Check-Out</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={editForm.checkOutDate} onSelect={(date) => setEditForm({ ...editForm, checkOutDate: date })} disabled={(date) => date < editForm.checkInDate} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        ) : (
                                            <span className="col-span-3 font-medium text-sm mt-2">
                                                {`${new Date(deepDetails.checkInDate).toLocaleDateString()} to ${new Date(deepDetails.checkOutDate).toLocaleDateString()}`}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                        <span className="font-semibold text-right text-sm text-muted-foreground">Date:</span>
                                        {isEditing && canEditSchedule ? (
                                            <div className="col-span-3">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-8 text-sm", !editForm.eventDate && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {editForm.eventDate ? format(editForm.eventDate, "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={editForm.eventDate} onSelect={(date) => setEditForm({ ...editForm, eventDate: date })} disabled={(date) => date < today} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        ) : (
                                            <span className="col-span-3 font-medium text-sm">
                                                {new Date(deepDetails.date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* TITLE */}
                                <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                    <span className="font-semibold text-right text-sm text-muted-foreground">Title:</span>
                                    {isEditing ? (
                                        <div className="col-span-3">
                                            <Input className="h-8 text-sm" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                                        </div>
                                    ) : (
                                        <span className="col-span-3 font-medium text-sm">{item.title}</span>
                                    )}
                                </div>


                                {/* VENUE (Only for events) */}
                                {/* DYNAMIC VENUE (Only for events) */}
                                {item.type === "event" && (
                                    <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                        <span className="font-semibold text-right text-sm text-muted-foreground">Venue:</span>
                                        {isEditing && canApprove ? (
                                            <div className="col-span-3">
                                                <Select value={editForm.venueId} onValueChange={(val) => setEditForm({ ...editForm, venueId: val })}>
                                                    <SelectTrigger className="h-8 text-sm w-full">
                                                        <SelectValue placeholder="Select Venue">
                                                            {venuesList.find((v) => v.id === editForm.venueId)?.name || "Select Venue"}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {venuesList.map((v) => (
                                                            <SelectItem key={v.id} value={v.id}>
                                                                {v.name} (Max: {v.capacity})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <span className="col-span-3 font-medium text-sm">{deepDetails?.venue?.name || "TBD"}</span>
                                        )}
                                    </div>
                                )}

                                {/* EDITABLE TIMES */}
                                {item.type !== "guest" && (
                                    <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                        <span className="font-semibold text-right text-sm text-muted-foreground">Time:</span>
                                        {isEditing && canEditSchedule ? (
                                            <div className="col-span-3 flex gap-2 items-center">
                                                <Select value={editForm.startTime} onValueChange={(val) => setEditForm({ ...editForm, startTime: val })}>
                                                    <SelectTrigger className="h-8 text-sm w-full">
                                                        <SelectValue placeholder="Start" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {timeSlots.map((slot) => (
                                                            <SelectItem key={`start-${slot.value}`} value={slot.value}>{slot.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <span className="text-muted-foreground">-</span>

                                                <Select value={editForm.endTime} onValueChange={(val) => setEditForm({ ...editForm, endTime: val })} disabled={!editForm.startTime}>
                                                    <SelectTrigger className="h-8 text-sm w-full">
                                                        <SelectValue placeholder="End" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableEndTimes.map((slot) => (
                                                            <SelectItem key={`end-${slot.value}`} value={slot.value}>{slot.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <span className="col-span-3 font-medium text-sm">
                                                {timeDisplayString}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* EVENT DESCRIPTION (Hidden if empty and not editing) */}
                                {item.type === "event" && (isEditing || deepDetails.description) && (
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <span className="font-semibold text-right text-sm text-muted-foreground">Details:</span>
                                        {isEditing ? (
                                            <div className="col-span-3">
                                                <Textarea className="min-h-[80px] text-sm resize-none" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                                            </div>
                                        ) : (
                                            <span className="col-span-3 text-sm whitespace-pre-wrap">{deepDetails.description}</span>
                                        )}
                                    </div>
                                )}

                                {/* VEHICLE DESTINATION & PURPOSE */}
                                {/* DYNAMIC VEHICLE SELECTION */}
                                {item.type === "vehicle" && (
                                    <div className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                        <span className="font-semibold text-right text-sm text-muted-foreground">Vehicle:</span>
                                        {isEditing && canApprove ? (
                                            <div className="col-span-3">
                                                <Select value={editForm.vehicleId} onValueChange={(val) => setEditForm({ ...editForm, vehicleId: val })}>
                                                    <SelectTrigger className="h-8 text-sm w-full">
                                                        <SelectValue placeholder="Select Vehicle">
                                                            {vehiclesList.find((v) => v.id === editForm.vehicleId)?.name || "Select Vehicle"}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {vehiclesList.map((v) => (
                                                            <SelectItem key={v.id} value={v.id}>
                                                                {v.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <span className="col-span-3 font-medium text-sm">{deepDetails?.vehicle?.name || "TBD"}</span>
                                        )}
                                    </div>
                                )}

                                {/* GUEST PURPOSE */}
                                {item.type === "guest" && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <span className="font-semibold text-right text-sm text-muted-foreground">Purpose:</span>
                                        {isEditing ? (
                                            <div className="col-span-3">
                                                <Input className="h-8 text-sm" value={editForm.purpose} onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })} />
                                            </div>
                                        ) : (
                                            <span className="col-span-3 font-medium text-sm">{deepDetails.purpose}</span>
                                        )}
                                    </div>
                                )}

                                {/* --- BUTTON RENDER AREA --- */}
                                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                                    {/* Left Side: Approver Controls */}
                                    <div>
                                        {!isEditing && canApprove && (item.status === "pending" || item.status === "approved") && (
                                            <div className="flex gap-2">
                                                <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="destructive">
                                                            Decline
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently decline and delete this {item.type} request from the database.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleDecline();
                                                                }}
                                                                disabled={isLoading}
                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                            >
                                                                {isLoading ? "Deleting..." : "Yes, decline & delete"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>

                                                {/* --- THE NEW APPROVE DIALOG --- */}
                                                {item.status === "pending" && (
                                                    <AlertDialog open={isApproveAlertOpen} onOpenChange={setIsApproveAlertOpen}>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                                                Approve
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Approve this {item.type}?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to approve this request? This will lock in the schedule and secure the resource.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleApprove();
                                                                    }}
                                                                    disabled={isLoading}
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                >
                                                                    {isLoading ? "Approving..." : "Yes, Approve"}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Side: Edit Controls */}
                                    <div className="flex gap-3">
                                        {isEditing ? (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                                <Button size="sm" onClick={handleSave} disabled={isLoading}>
                                                    {isLoading ? "Saving..." : "Save Changes"}
                                                </Button>
                                            </>
                                        ) : (
                                            canEdit && (
                                                <Button size="sm" variant="secondary" onClick={handleEditStart}>
                                                    Edit Details
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
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