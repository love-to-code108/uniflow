"use client"

import React, { useState } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitEventRequest } from "@/actions/events";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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

// The new Field/Form components based on your setup
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import {
    InputGroup,
    InputGroupTextarea,
} from "@/components/ui/input-group";

import EventCell from "./EventCell";

import { useAuthStore } from "@/store/globalStates";
import { toast } from "sonner";


import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { submitVehicleRequest } from "@/actions/vehicles";
import { submitGuestRequest } from "@/actions/guests";


// --- 1. DATA & SCHEMA CONFIGURATION ---

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









const formSchema = z.object({
    eventName: z.string().min(1, "Event Name is required"),
    eventDescription: z.string().optional(),
    eventDate: z.date({
        required_error: "Please select a date",
    }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    expectedStudents: z.coerce.number().min(1, "Must be at least 1 student"),
    registrationLink: z.string().url("Must be a valid URL").or(z.literal('')),
});



// --- 2. SEPARATED FORM COMPONENT ---

const CreateEventForm = ({ preFilledDate, onSuccess }) => {

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            eventName: "",
            eventDescription: "",
            eventDate: preFilledDate,
            startTime: "",
            endTime: "",
            expectedStudents: "",
            registrationLink: "",
        }
    });

    const selectedStartTime = form.watch("startTime");

    // Dynamically filter end times
    const availableEndTimes = selectedStartTime
        ? timeSlots.filter(slot => slot.value > selectedStartTime)
        : timeSlots;

    // const onSubmit = (data) => {
    //     console.log("Submitted Event Data:", data);
    //     if (onSuccess) onSuccess();
    // };

    // const user = useAuthStore((state) => state.user)


    const onSubmit = async (data) => {
        // --- THE TIMEZONE FIX ---
        // Grab the date they picked, and force the time to 12:00 PM (Noon) local time
        const safeDate = new Date(
            data.eventDate.getFullYear(),
            data.eventDate.getMonth(),
            data.eventDate.getDate(),
            12, 0, 0
        );

        // Swap out the raw date for our timezone-proof date
        const payload = {
            ...data,
            eventDate: safeDate
        };
        // ------------------------

        // 1. Initial attempt (Use the payload now, not the raw data!)
        const response = await submitEventRequest(payload);

        // 2. Handle Gatekeeper Rejections
        if (response.status === "ERROR") {
            toast.error(response.message); // Will show "Unauthorized" or "Forbidden"
            return; // Stop execution
        }

        // 3. Handle standard backend flags
        if (response.status === "SUCCESS") {
            toast.success(`Event requested in ${response.venue}!`);
            onSuccess(false);
        }
        else if (response.status === "CAPACITY_WARNING") {
            toast(response.message, {
                action: {
                    label: "Accept & Proceed",
                    onClick: async () => {
                        const forcedRes = await submitEventRequest(data, { forceCapacity: true });
                        if (forcedRes.status === "SUCCESS") {
                            toast.success("Event request submitted despite capacity limits.");
                            onSuccess(false);
                        }
                    }
                }
            });
        }
        else if (response.status === "ALTERNATIVE_AVAILABLE") {
            toast(`Target auditorium is full. Request ${response.suggestedVenue} instead?`, {
                action: {
                    label: `Book ${response.suggestedVenue}`,
                    onClick: async () => {
                        const altRes = await submitEventRequest(data, { acceptedVenue: response.suggestedVenue });
                        if (altRes.status === "SUCCESS") {
                            toast.success(`Event requested in ${response.suggestedVenue}!`);
                            onSuccess(false);
                        }
                    }
                }
            });
        }
        else if (response.status === "NO_VENUES") {
            toast.error(response.message);
        }



    }



    // Calculate today's date with time set to 00:00:00 to disable past days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <form id="createNewEventForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FieldGroup>

                {/* Event Name */}
                <Controller
                    name="eventName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="eventName">Event Name</FieldLabel>
                            <Input
                                {...field}
                                id="eventName"
                                aria-invalid={fieldState.invalid}
                                placeholder="Annual Hackathon"
                                autoComplete="off"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />

                {/* Event Description */}
                <Controller
                    name="eventDescription"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="eventDescription">Event Description</FieldLabel>
                            <InputGroup>
                                <InputGroupTextarea
                                    {...field}
                                    id="eventDescription"
                                    placeholder="Details about the event..."
                                    rows={4}
                                    className="resize-none"
                                    aria-invalid={fieldState.invalid}
                                />
                            </InputGroup>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />

                {/* Event Date Picker */}
                <Controller
                    name="eventDate"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="eventDate">Event Date</FieldLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="eventDate"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        aria-invalid={fieldState.invalid}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < today} // Prevent past dates
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    {/* Start Time Select */}
                    <Controller
                        name="startTime"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="startTime">Start Time</FieldLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger id="startTime" aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder="Select start time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.map((slot) => (
                                            <SelectItem key={`start-${slot.value}`} value={slot.value}>
                                                {slot.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    {/* End Time Select (Dynamic) */}
                    <Controller
                        name="endTime"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="endTime">End Time</FieldLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!selectedStartTime}
                                >
                                    <SelectTrigger id="endTime" aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder="Select end time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEndTimes.map((slot) => (
                                            <SelectItem key={`end-${slot.value}`} value={slot.value}>
                                                {slot.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Expected Students */}
                    <Controller
                        name="expectedStudents"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="expectedStudents">Expected Students</FieldLabel>
                                <Input
                                    {...field}
                                    id="expectedStudents"
                                    type="number"
                                    placeholder="e.g. 50"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    {/* Registration Link */}
                    <Controller
                        name="registrationLink"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="registrationLink">Registration Link (Optional)</FieldLabel>
                                <Input
                                    {...field}
                                    id="registrationLink"
                                    type="url"
                                    placeholder="https://..."
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </div>
            </FieldGroup>

            <div className="w-full flex justify-end pt-4">
                <Button type="submit" form="createNewEventForm">Create Event</Button>
            </div>
        </form>
    );
};


























// --- VEHICLE ZOD SCHEMA ---
const vehicleFormSchema = z.object({
    vehicleId: z.string().min(1, "Please select a vehicle"),
    eventDate: z.date({
        required_error: "Please select a date",
    }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    destination: z.string().min(1, "Destination is required"),
    purpose: z.string().min(1, "Purpose of the trip is required"),
});

// --- VEHICLE FORM COMPONENT ---
const CreateVehicleForm = ({ preFilledDate, onSuccess }) => {
    const form = useForm({
        resolver: zodResolver(vehicleFormSchema),
        defaultValues: {
            vehicleId: "",
            eventDate: preFilledDate,
            startTime: "",
            endTime: "",
            destination: "",
            purpose: "",
        }
    });

    const selectedStartTime = form.watch("startTime");

    // Dynamically filter end times
    const availableEndTimes = selectedStartTime
        ? timeSlots.filter(slot => slot.value > selectedStartTime)
        : timeSlots;

    const onSubmit = async (data) => {
        const safeDate = new Date(data.eventDate.getFullYear(), data.eventDate.getMonth(), data.eventDate.getDate(), 12, 0, 0);
        const payload = { ...data, eventDate: safeDate };

        const response = await submitVehicleRequest(payload);

        if (response.status === "ERROR") {
            toast.error(response.message);
            return;
        }

        if (response.status === "SUCCESS") {
            toast.success("Vehicle request submitted successfully!");
            if (onSuccess) onSuccess(false);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <form id="createVehicleForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FieldGroup>

                {/* Vehicle Selection */}
                <Controller
                    name="vehicleId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="vehicleId">Select Vehicle</FieldLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="vehicleId" aria-invalid={fieldState.invalid}>
                                    <SelectValue placeholder="Choose a vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Kia_Carens">Kia Carens</SelectItem>
                                    <SelectItem value="Innova">Innova</SelectItem>
                                    <SelectItem value="Ertiga">Ertiga</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />

                {/* Date Picker */}
                <Controller
                    name="eventDate"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="eventDate">Date Required</FieldLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="eventDate"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        aria-invalid={fieldState.invalid}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < today}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />

                {/* Time Selectors */}
                <div className="grid grid-cols-2 gap-4">
                    <Controller
                        name="startTime"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="startTime">Start Time</FieldLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger id="startTime" aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder="Select start time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.map((slot) => (
                                            <SelectItem key={`start-${slot.value}`} value={slot.value}>
                                                {slot.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="endTime"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="endTime">End Time</FieldLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!selectedStartTime}
                                >
                                    <SelectTrigger id="endTime" aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder="Select end time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEndTimes.map((slot) => (
                                            <SelectItem key={`end-${slot.value}`} value={slot.value}>
                                                {slot.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </div>

                {/* Destination & Purpose */}
                <div className="grid grid-cols-2 gap-4">
                    <Controller
                        name="destination"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="destination">Destination</FieldLabel>
                                <Input
                                    {...field}
                                    id="destination"
                                    placeholder="e.g., Tech Park"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="purpose"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="purpose">Purpose</FieldLabel>
                                <Input
                                    {...field}
                                    id="purpose"
                                    placeholder="e.g., Guest Pickup"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </div>

            </FieldGroup>

            <div className="w-full flex justify-end pt-4">
                <Button type="submit" form="createVehicleForm">Submit Request</Button>
            </div>
        </form>
    );
};






















// --- GUEST ZOD SCHEMA ---
const guestFormSchema = z.object({
    roomId: z.string().min(1, "Please select a room"),
    checkInDate: z.date({
        required_error: "Check-in date is required",
    }),
    checkOutDate: z.date({
        required_error: "Check-out date is required",
    }),
    guestName: z.string().min(1, "Guest name is required"),
    purpose: z.string().min(1, "Purpose of stay is required"),
});

// --- GUEST FORM COMPONENT ---
const CreateGuestForm = ({ preFilledDate, onSuccess }) => {
    const form = useForm({
        resolver: zodResolver(guestFormSchema),
        defaultValues: {
            roomId: "",
            checkInDate: preFilledDate,
            checkOutDate: preFilledDate, // Defaults to same day
            guestName: "",
            purpose: "",
        }
    });

    const onSubmit = async (data) => {
        // --- THE DOUBLE TIMEZONE FIX ---
        const safeCheckIn = new Date(
            data.checkInDate.getFullYear(),
            data.checkInDate.getMonth(),
            data.checkInDate.getDate(),
            12, 0, 0
        );

        const safeCheckOut = new Date(
            data.checkOutDate.getFullYear(),
            data.checkOutDate.getMonth(),
            data.checkOutDate.getDate(),
            12, 0, 0
        );

        const payload = {
            ...data,
            checkInDate: safeCheckIn,
            checkOutDate: safeCheckOut
        };

        const response = await submitGuestRequest(payload);

        if (response.status === "ERROR") {
            toast.error(response.message);
            return;
        }

        if (response.status === "SUCCESS") {
            toast.success("Guest room request submitted successfully!");
            if (onSuccess) onSuccess(false);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <form id="createGuestForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FieldGroup>

                {/* Room Selection */}
                <Controller
                    name="roomId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="roomId">Select Room</FieldLabel>

                            {/* FIX: Change defaultValue to value */}
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="roomId" aria-invalid={fieldState.invalid}>
                                    <SelectValue placeholder="Choose a guest room" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="202A">Room 202A</SelectItem>
                                    <SelectItem value="202B">Room 202B</SelectItem>
                                    <SelectItem value="203A">Room 203A</SelectItem>
                                    <SelectItem value="203B">Room 203B</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />



                {/* Date Pickers (Check-In & Check-Out) */}
                <div className="grid grid-cols-2 gap-4">
                    <Controller
                        name="checkInDate"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="checkInDate">Check-In</FieldLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="checkInDate"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < today}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="checkOutDate"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="checkOutDate">Check-Out</FieldLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="checkOutDate"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < form.watch("checkInDate")} // Prevents checkout before checkin
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </div>

                {/* Guest Details */}
                <div className="grid grid-cols-2 gap-4">
                    <Controller
                        name="guestName"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="guestName">Guest Name</FieldLabel>
                                <Input
                                    {...field}
                                    id="guestName"
                                    placeholder="e.g., Dr. Smith"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="purpose"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="purpose">Purpose of Stay</FieldLabel>
                                <Input
                                    {...field}
                                    id="purpose"
                                    placeholder="e.g., Guest Lecture"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </div>

            </FieldGroup>

            <div className="w-full flex justify-end pt-4">
                <Button type="submit" form="createGuestForm">Submit Request</Button>
            </div>
        </form>
    );
};




















// --- 3. MAIN CALENDAR CELL COMPONENT ---

const CalanderCell = ({ value, dayData = [] }) => {
    // 1. Upgraded State: Instead of true/false, we track WHICH modal is open
    const [activeModal, setActiveModal] = useState(null);

    // 2. Fetch the user's permissions directly from your Zustand store
    const user = useAuthStore((state) => state.user);
    const permissions = user?.permissions || {};

    const preFilledDate = new Date(value.year, value.month - 1, value.day);

    // --- NEW: Time Math for Figma Styling ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(value.year, value.month - 1, value.day);

    const isPast = cellDate < today;
    // ----------------------------------------

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div className="relative flex flex-col w-full min-h-[150px] border-r-[1px] border-b-[1px] border-border hover:bg-muted/50 p-2">

                        {/* THE BULLETPROOF CLICK CATCHER */}
                        <div
                            className="absolute inset-0 z-0 cursor-pointer"
                            onClick={() => setActiveModal("event")}
                        />

                        {/* --- The Day Number Highlight --- */}
                        <div className="relative z-10 w-full flex justify-end mb-1 pointer-events-none">
                            {value.isToday ? (
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FF542D] text-white font-bold shadow-sm">
                                    {value.day}
                                </div>
                            ) : (
                                <p className={value.isCurrentMonth ? "text-foreground font-medium" : "text-muted-foreground"}>
                                    {value.day}
                                </p>
                            )}
                        </div>

                        {/* The Event Blocks */}
                        <div className="relative z-10 flex flex-col gap-1 w-full mt-1 overflow-y-auto">
                            {dayData.map((item) => (
                                <EventCell key={item.id} item={item} isPast={isPast} />
                            ))}
                        </div>
                    </div>
                </ContextMenuTrigger>

                {/* --- THE DYNAMIC RIGHT-CLICK MENU --- */}
                <ContextMenuContent className="w-56">
                    <ContextMenuItem onClick={() => setActiveModal("event")}>
                        Request Event
                    </ContextMenuItem>

                    {/* Conditional rendering based on exact DB keys */}
                    {permissions.can_request_for_vehicles && (
                        <ContextMenuItem onClick={() => setActiveModal("vehicle")}>
                            Request Vehicle
                        </ContextMenuItem>
                    )}

                    {permissions.can_request_guest_room && (
                        <ContextMenuItem onClick={() => setActiveModal("lodging")}>
                            Request Guest Lodging
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            </ContextMenu>


            {/* --- THE MODALS --- */}
            {/* Event Modal */}
            <Dialog open={activeModal === "event"} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create new event</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to schedule an event.
                        </DialogDescription>
                    </DialogHeader>
                    <CreateEventForm
                        preFilledDate={preFilledDate}
                        onSuccess={() => setActiveModal(null)}
                    />
                </DialogContent>
            </Dialog>






            {/* Vehicle Modal */}
            <Dialog open={activeModal === "vehicle"} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Request a Vehicle</DialogTitle>
                        <DialogDescription>
                            Submit a request for transportation. Subject to admin approval.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Drop it right here! */}
                    <CreateVehicleForm
                        preFilledDate={preFilledDate}
                        onSuccess={() => setActiveModal(null)}
                    />

                </DialogContent>
            </Dialog>




            {/* Lodging Modal */}
            <Dialog open={activeModal === "lodging"} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Request Guest Lodging</DialogTitle>
                        <DialogDescription>
                            Submit a room request. Subject to admin approval.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Drop it right here! */}
                    <CreateGuestForm
                        preFilledDate={preFilledDate}
                        onSuccess={() => setActiveModal(null)}
                    />

                </DialogContent>
            </Dialog>
        </>
    );
};

export default CalanderCell;