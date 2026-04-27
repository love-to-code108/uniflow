import * as z from "zod"
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";


import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"


import { Checkbox } from "@/components/ui/checkbox";
import { createNewUser } from "@/lib/createNewUser";




// form schema
const formSchema = z.object({
    "UserName": z.string(),

    "Password": z
        .string(),

    "can_request_event": z
        .boolean(),

    "can_request_for_vehicles": z
        .boolean(),

    "can_request_guest_room": z
        .boolean(),

    "can_approve_events": z
        .boolean(),

    "can_approve_guests": z
        .boolean(),

    "can_approve_vehicles": z
        .boolean(),

    "has_priority": z
        .boolean(),

    "can_create_users": z.boolean(),
    "can_manage_system": z.boolean()

})








const CreateNewUserForm = ({ className }) => {


    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            "UserName": "",
            "Password": "",
            "can_request_event": false,
            "can_request_for_vehicles": false,
            "can_request_guest_room": false,
            "can_approve_events": false,
            "can_approve_guests": false,
            "can_approve_vehicles": false,
            "has_priority": false,
            "can_create_users": false,     // NEW
            "can_manage_system": false,    // NEW
        }
    })




    const onSubmit = async (data) => {

        const r = await createNewUser(data);

        console.log(r)

        if (r.type === "error") {
            form.setError("UserName", {
                type: "manual",
                message: r.message
            })

            return;
        }

        toast.success(r.message)

    }







    return (

        <form id="createNewUserForm" onSubmit={form.handleSubmit(onSubmit)}>


            <FieldGroup>



                {/* userName field */}
                <Controller
                    name="UserName"
                    control={form.control}
                    render={({ field, fieldState }) => (

                        <Field data-invalid={fieldState.invalid}>


                            <FieldLabel htmlFor="UserName">
                                Username
                            </FieldLabel>


                            <Input
                                {...field}
                                id="UserName"
                                aria-invalid={fieldState.invalid}
                                placeholder=""
                                autoComplete="off"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />







                {/* Email */}
                <Controller
                    name="Password"
                    control={form.control}
                    render={({ field, fieldState }) => (

                        <Field data-invalid={fieldState.invalid}>


                            <FieldLabel htmlFor="Password">
                                Password
                            </FieldLabel>


                            <Input
                                {...field}
                                id="Password"
                                aria-invalid={fieldState.invalid}
                                placeholder=""
                                autoComplete="off"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />








                {/* checkbox */}
                <FieldSet>

                    <FieldLegend>
                        Account Privileges
                    </FieldLegend>

                    <FieldDescription>
                        Grant specific permissions to allow this user to manage or request resources.
                    </FieldDescription>



                    <FieldGroup className={"gap-2"}>
                        <FieldLabel>Requests</FieldLabel>


                        {/* can create events */}
                        <Controller
                            name="can_request_event"
                            control={form.control}
                            render={({ field }) => (

                                <Field orientation="horizontal">
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="canRequestEvents"
                                        name="canRequestEvents" />

                                    <FieldLabel className={"font-normal"} htmlFor="canRequestEvents">
                                        Request Events.
                                    </FieldLabel>
                                </Field>
                            )}
                        />





                        {/* can request for vehicles */}
                        <Controller
                            name="can_request_for_vehicles"
                            control={form.control}
                            render={({ field }) => (

                                <Field orientation="horizontal">
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="canRequestForVehicles"
                                        name="canRequestForVehicles" />

                                    <FieldLabel className={"font-normal"} htmlFor="canRequestForVehicles">
                                        Request Vehicles.
                                    </FieldLabel>
                                </Field>
                            )}
                        />





                        {/* can request for guest room for guest */}
                        <Controller
                            name="can_request_guest_room"
                            control={form.control}
                            render={({ field }) => (

                                <Field orientation="horizontal">
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="canRequestGuestRoom"
                                        name="canRequestGuestRoom" />

                                    <FieldLabel className={"font-normal"} htmlFor="canRequestGuestRoom">
                                        Request Guest Rooms.
                                    </FieldLabel>
                                </Field>
                            )}
                        />


                    </FieldGroup>






                    <FieldGroup className={"gap-2"}>
                        <FieldLabel>
                            Approvals
                        </FieldLabel>


                        {/* can approve events */}
                        <Controller
                            name="can_approve_events"
                            control={form.control}
                            render={({ field }) => (

                                <Field orientation="horizontal">
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="canApproveEvents"
                                        name="canApproveEvents" />

                                    <FieldLabel className={"font-normal"} htmlFor="canApproveEvents">
                                        Approve Events.
                                    </FieldLabel>
                                </Field>
                            )}
                        />




                        {/* can approve guests */}
                        <Controller
                            name="can_approve_guests"
                            control={form.control}
                            render={({ field }) => (

                                <Field orientation="horizontal">
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="canApproveGuests"
                                        name="canApproveGuests" />

                                    <FieldLabel className={"font-normal"} htmlFor="canApproveGuests">
                                        Approve Guest Rooms.
                                    </FieldLabel>
                                </Field>
                            )}
                        />






                        {/* can approve vehicles */}
                        <Controller
                            name="can_approve_vehicles"
                            control={form.control}
                            render={({ field }) => (

                                <Field orientation="horizontal">
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="canApproveVehicles"
                                        name="canApproveVehicles" />

                                    <FieldLabel className={"font-normal"} htmlFor="canApproveVehicles">
                                        Approve Vehicles.
                                    </FieldLabel>
                                </Field>
                            )}
                        />


                        {/* Can Create Users */}
                        <Controller
                            name="can_create_users"
                            control={form.control}
                            render={({ field }) => (
                                <Field orientation="horizontal" className="">
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="can_create_users"
                                        name="can_create_users"
                                    />
                                    <FieldLabel className="font-bold text-red-500" htmlFor="can_create_users">
                                        Can Create Users (Admin)
                                    </FieldLabel>
                                </Field>
                            )}
                        />

                        {/* Can Manage System */}
                        <Controller
                            name="can_manage_system"
                            control={form.control}
                            render={({ field }) => (
                                <Field orientation="horizontal" className="">
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="can_manage_system"
                                        name="can_manage_system"
                                    />
                                    <FieldLabel className="font-bold text-red-500" htmlFor="can_manage_system">
                                        Can Manage System (Admin)
                                    </FieldLabel>
                                </Field>
                            )}
                        />




                        {/* has priority */}
                        <Controller

                            name="has_priority"
                            control={form.control}
                            render={({ field }) => (

                                <Field orientation="horizontal"
                                    className={"mt-4"}
                                >
                                    <Checkbox

                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="has_priority"
                                        name="has_priority" />

                                    <FieldLabel className={"font-bold"} htmlFor="has_priority">
                                        Priority.
                                    </FieldLabel>
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </FieldSet>






            </FieldGroup>


            <div className=" w-full flex justify-end mt-[20px]">
                <Button type="submit" form="createNewUserForm">Create</Button>
            </div>
        </form>

    );
}


export default CreateNewUserForm;