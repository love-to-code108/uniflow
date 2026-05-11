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
import { createNewGuestRoom } from "@/actions/guests"; 

// The Zod Schema for strict validation
const formSchema = z.object({
    name: z.string().min(2, "Room name/number must be at least 2 characters."),
});

const CreateNewGuestRoomForm = () => {

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: ""
        }
    });

    const onSubmit = async (data) => {
        const response = await createNewGuestRoom(data);

        if (response.status === "ERROR") {
            form.setError("name", {
                type: "manual",
                message: response.message
            });
            toast.error("Failed to add guest room.");
            return;
        }

        toast.success(response.message);
        form.reset(); 
    }

    return (
        <form id="createNewGuestRoomForm" onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
            <FieldGroup className="gap-6">
                
                {/* Room Name Input */}
                <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="roomName">Room Name / Number</FieldLabel>
                            <Input
                                {...field}
                                id="roomName"
                                aria-invalid={fieldState.invalid}
                                placeholder="e.g., Room 202A (VIP)"
                                autoComplete="off"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

            </FieldGroup>

            <div className="w-full flex justify-end mt-8">
                <Button type="submit" form="createNewGuestRoomForm">Add Guest Room</Button>
            </div>
        </form>
    );
}

export default CreateNewGuestRoomForm;