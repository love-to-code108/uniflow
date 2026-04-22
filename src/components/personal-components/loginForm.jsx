"use client"

import * as z from "zod"
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"

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




import { useAuth } from "@/store/useAuth";
import { authenticateUser } from "@/lib/actions";
import { toast } from "sonner";





// form schema
const formSchema = z.object({
    "userName": z
        .string(),

    "password": z
        .string(),

})








const LoginForm = ({ className }) => {


    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            "userName": "",
            "password": ""
        }
    })




    const onSubmit = async (data) => {

        console.log("working");
        console.log(data);
        

        const login = useAuth.getState().login; // Get the zustand login function
        const result = await authenticateUser(data);

            





        if (result.success) {
            toast.success("Success!", {
                description: `Welcome back, ${result.user.name}`,
            });
            login(result.user); // Save user to Zustand
            // Here you would use router.push('/dashboard') to move the user
        } else {
            toast.error("Login Failed", {
                description: result.message,
            });
        }




        // toast("We have received your request", {
        //     position: "bottom-left",
        //     description: "We will reach back to you shortly",
        //     className: "text-white bg-black"

        // })



        // console.log(data)
        form.reset()

    }







    return (
        <Card className={` lg:w-[400px] xl:w-[400px] ${className}`}>


            <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter the credentials to login into uniflow</CardDescription>
            </CardHeader>


            <CardContent>
                <form id="ContactUsForm" onSubmit={form.handleSubmit(onSubmit)}>


                    <FieldGroup>



                        {/* name field */}
                        <Controller
                            name="userName"
                            control={form.control}
                            render={({ field, fieldState }) => (

                                <Field data-invalid={fieldState.invalid}>


                                    <FieldLabel htmlFor="LoginFormUserName">
                                        Username
                                    </FieldLabel>


                                    <Input
                                        {...field}
                                        id="LoginFormUserName"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="username"
                                        autoComplete="off"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />




                        {/* Password field */}
                        <Controller
                            name="password"
                            control={form.control}
                            render={({ field, fieldState }) => (

                                <Field data-invalid={fieldState.invalid}>


                                    <FieldLabel htmlFor="LoginFormPassword">
                                        Password
                                    </FieldLabel>


                                    <Input
                                        {...field}
                                        id="LoginFormPassword"
                                        type={"password"}
                                        aria-invalid={fieldState.invalid}
                                        placeholder="password"
                                        autoComplete="off"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />









                    </FieldGroup>
                </form>
            </CardContent>


            <CardFooter>
                <Field orientation="horizontal">

                    <Button type="button" variant="outline"
                        onClick={() => form.reset()}
                    >Reset</Button>



                    <Button type="submit" form="ContactUsForm">Submit</Button>
                </Field>
            </CardFooter>


        </Card>
    );
}


export default LoginForm;