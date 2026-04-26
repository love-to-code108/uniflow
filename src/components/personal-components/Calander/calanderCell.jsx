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
        // We no longer need to pass user.id from Zustand into the payload!
        // The Gatekeeper handles identity automatically via the secure cookie.
        
        // 1. Initial attempt
        const response = await submitEventRequest(data);

        // 2. Handle Gatekeeper Rejections
        if (response.status === "ERROR") {
            toast.error(response.message); // Will show "Unauthorized" or "Forbidden"
            return; // Stop execution
        }

        // 3. Handle standard backend flags
        if (response.status === "SUCCESS") {
            toast.success(`Event requested in ${response.venue}!`);
            setIsDialogOpen(false); 
        }
        else if (response.status === "CAPACITY_WARNING") {
            toast(response.message, {
                action: {
                    label: "Accept & Proceed",
                    onClick: async () => {
                        const forcedRes = await submitEventRequest(data, { forceCapacity: true });
                        if (forcedRes.status === "SUCCESS") {
                            toast.success("Event request submitted despite capacity limits.");
                            setIsDialogOpen(false);
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
                            setIsDialogOpen(false);
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


























// --- 3. MAIN CALENDAR CELL COMPONENT ---

const CalanderCell = ({ value }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const preFilledDate = new Date(value.year, value.month - 1, value.day);

    return (

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

            <DialogTrigger asChild>
                <div className="flex w-full min-h-[180px] border-r-[1px] border-b-[1px] border-border cursor-pointer">
                    <div className="bg-background w-full py-2 px-4 hover:bg-primary-foreground">

                        <div className="w-full flex justify-end">
                            <p className={value.isCurrentMonth ? "text-foreground" : "text-muted"}>
                                {value.day}
                            </p>
                        </div>
                        <br />

                        <EventCell />
                    </div>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create new event</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to schedule an event.
                    </DialogDescription>
                </DialogHeader>

                <CreateEventForm
                    preFilledDate={preFilledDate}
                // onSuccess={() => setIsDialogOpen(false)}
                />

            </DialogContent>
        </Dialog>

    );
};

export default CalanderCell;