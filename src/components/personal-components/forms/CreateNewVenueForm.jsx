"use client"

import * as z from "zod"
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { createNewVenue } from "@/actions/calendar"; // Assuming you put the action here

// The Zod Schema for strict validation
const formSchema = z.object({
    name: z.string().min(2, "Venue name must be at least 2 characters."),
    capacity: z.coerce.number().min(1, "Capacity must be at least 1 person."),
});

const CreateNewVenueForm = () => {

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            capacity: ""
        }
    });

    const onSubmit = async (data) => {
        const response = await createNewVenue(data);

        if (response.status === "ERROR") {
            form.setError("name", {
                type: "manual",
                message: response.message
            });
            toast.error("Failed to add venue.");
            return;
        }

        toast.success(response.message);
        form.reset(); // Clear the form on success
    }

    return (
        <form id="createNewVenueForm" onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
            <FieldGroup className="gap-6">
                
                {/* Venue Name Input */}
                <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="venueName">Venue Name</FieldLabel>
                            <Input
                                {...field}
                                id="venueName"
                                aria-invalid={fieldState.invalid}
                                placeholder="e.g., Block B Auditorium"
                                autoComplete="off"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                {/* Capacity Input */}
                <Controller
                    name="capacity"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="venueCapacity">Maximum Capacity</FieldLabel>
                            <Input
                                {...field}
                                id="venueCapacity"
                                type="number"
                                aria-invalid={fieldState.invalid}
                                placeholder="e.g., 150"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

            </FieldGroup>

            <div className="w-full flex justify-end mt-8">
                <Button type="submit" form="createNewVenueForm">Add Venue</Button>
            </div>
        </form>
    );
}

export default CreateNewVenueForm;