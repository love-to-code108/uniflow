"use client"
import React from "react";
import { Button } from "@/components/ui/button";
import EventCell from "./EventCell";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"

import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group"

import { toast } from "sonner";
import z, { any } from "zod";



import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";






// form schema
const formSchema = z.object({
    "eventName": z
        .string(),

    "eventDescription": z
        .string(),

    "eventDate": z.date({
        required_error: "Please select a date",
    }).transform((val) => val.toISOString().split('T')[0]),

    "startTime": z
        .any(),

    // "endTime": z
    //     .string(),

    // "registrationLink": z
    //     .string(),

    // "expectedNumberOfStudents": z
    //     .string(),

})











const CalanderCell = ({ value }) => {

    // console.log(value.month)
    const preFilledDate = new Date(value.year, value.month - 1, value.day);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            "eventName": "",
            "eventDescription": "",
            eventDate: preFilledDate,
            "startTime": "",
            // "endTime": "",
            // "registrationLink": "",
            // "expectedNumberOfStudents": "",
        }
    })





    const [Date12, setDate12] = React.useState(preFilledDate)
    // const [open, setOpen] = React.useState(false)
    // const [date, setDate] = React.useState(undefined)






    // function that runs on form submit
    const onSubmit = async (data) => {

        console.log("onsubmit running")
        console.log(data);
    }













    return (
        <Dialog>
            <DialogTrigger className={"w-full flex justify-center"}>
                <div
                    className=" flex justify-center items-center
        
        
        w-full min-h-[180px]
        border-r-[1px] border-b-[1px] border-border

        ">


                    <div className="bg-background w-full h-full
            
            py-2 px-4
            hover:bg-primary-foreground
            ">


                        {/* date */}
                        <div className=" w-full flex justify-end">
                            <p className={value.isCurrentMonth ? "text-foreground" : "text-border"}

                            >{value.day}</p>
                        </div>

                        <br />




                        {/* events */}
                        <EventCell />
                    </div>

                </div>
            </DialogTrigger>



            {/* dialog header */}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create new event</DialogTitle>
                    <DialogDescription>
                        Please fill the details below
                    </DialogDescription>
                </DialogHeader>


                {/* create new event form */}
                <form id="createNewEventForm"
                    onSubmit={form.handleSubmit(onSubmit)}>


                    <FieldGroup className={"gap-3"}>



                        {/* event name */}
                        <Controller
                            name="eventName"
                            control={form.control}
                            render={({ field, fieldState }) => (

                                <Field data-invalid={fieldState.invalid}>


                                    <FieldLabel htmlFor="createNewEventEventName">
                                        Event Name
                                    </FieldLabel>


                                    <Input
                                        {...field}
                                        id="createNewEventEventName"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Event Name"
                                        autoComplete="off"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />






                        {/* event description */}
                        <Controller
                            name="eventDescription"
                            control={form.control}
                            render={({ field, fieldState }) => (

                                <Field data-invalid={fieldState.invalid}>


                                    <FieldLabel htmlFor="eventDescription">
                                        Event Description
                                    </FieldLabel>


                                    <Textarea
                                        {...field}
                                        id="eventDescription"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Event Description"
                                        autoComplete="off"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />




                        {/* date */}
                        <Controller
                            control={form.control}
                            name="eventDate"
                            rules={{ required: "Date is required" }}
                            render={({ field }) => (
                                <Popover>
                                    <FieldLabel htmlFor="eventDate">
                                        Event Date
                                    </FieldLabel>
                                    <PopoverTrigger asChild>
                                        <div className=" w-full flex justify-start">
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    " justify-start text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            id="eventDate"
                                            mode="single"
                                            selected={Date12}
                                            onSelect={(date) => {
                                                setDate(date)
                                                setOpen(false)
                                            }} // Updates the form state directly
                                            disabled={(date) =>
                                                date < new Date() || date < new Date("1900-01-01")
                                            }

                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />






                        {/* start time */}
                        <Controller
                            name="startTime"
                            control={form.control}
                            render={({ field, fieldState }) => (

                                <Field data-invalid={fieldState.invalid}>


                                    <FieldLabel htmlFor="startTime">
                                        Start Time
                                    </FieldLabel>

                                    <div className=" w-full flex justify-start">
                                        <Input
                                            {...field}
                                            type="time"
                                            id="startTime"
                                            aria-invalid={fieldState.invalid}
                                            className="
                                    w-[65px]
                                    appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                        />
                                    </div>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />









                        {/* end time */}
                        {/* <Controller
                            name="endTime"
                            control={form.control}
                            render={({ field, fieldState }) => (

                                <Field data-invalid={fieldState.invalid}>


                                    <FieldLabel htmlFor="endTime">
                                        End Time
                                    </FieldLabel>

                                    <div className=" w-full flex ">
                                        <Input

                                            type="time"
                                            id="endTime"
                                            aria-invalid={fieldState.invalid}
                                            step="1"
                                            defaultValue="12:30:00"
                                            className="
                                    w-[90px]
                                    appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                        />
                                    </div>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        /> */}









                        {/* registration link */}
                        {/* <Controller
                            name="registrationLink"
                            control={form.control}
                            render={({ field, fieldState }) => (

                                <Field data-invalid={fieldState.invalid}>


                                    <FieldLabel htmlFor="registrationLink">
                                        Registration Link
                                    </FieldLabel>


                                    <Input
                                        {...field}
                                        id="registrationLink"
                                        aria-invalid={fieldState.invalid}
                                        autoComplete="off"
                                        placeholder="https://api.example.com/webhook"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        /> */}





                        {/* expected number of students */}
                        {/* <Controller
                            name="expectedNumberOfStudents"
                            control={form.control}
                            render={({ field, fieldState }) => (

                                <Field data-invalid={fieldState.invalid}>


                                    <FieldLabel htmlFor="expectedNumberOfStudents">
                                        Expected number of students
                                    </FieldLabel>


                                    <Input
                                        {...field}
                                        id="expectedNumberOfStudents"
                                        aria-invalid={fieldState.invalid}
                                        autoComplete="off"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        /> */}

                    </FieldGroup>



                    <div className=" w-full flex justify-end mt-[20px]">
                        <Button type="submit" form="createNewEventForm">Create</Button>
                    </div>





                </form>

            </DialogContent>






        </Dialog>
    )
}


export default CalanderCell;