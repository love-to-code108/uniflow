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
import { createNewVehicle } from "@/actions/vehicles"; 

// The Zod Schema for strict validation
const formSchema = z.object({
    name: z.string().min(2, "Vehicle name must be at least 2 characters."),
});

const CreateNewVehicleForm = () => {

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: ""
        }
    });

    const onSubmit = async (data) => {
        const response = await createNewVehicle(data);

        if (response.status === "ERROR") {
            form.setError("name", {
                type: "manual",
                message: response.message
            });
            toast.error("Failed to add vehicle.");
            return;
        }

        toast.success(response.message);
        form.reset(); // Clear the form on success
    }

    return (
        <form id="createNewVehicleForm" onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
            <FieldGroup className="gap-6">
                
                {/* Vehicle Name Input */}
                <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="vehicleName">Vehicle Name / Model</FieldLabel>
                            <Input
                                {...field}
                                id="vehicleName"
                                aria-invalid={fieldState.invalid}
                                placeholder="e.g., Kia Carens (WB-12-3456)"
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
                <Button type="submit" form="createNewVehicleForm">Add Vehicle</Button>
            </div>
        </form>
    );
}

export default CreateNewVehicleForm;