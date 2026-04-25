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

const CalanderCell = ({ value }) => {



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




            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create new event</DialogTitle>
                    <DialogDescription>
                        Please fill the details below
                    </DialogDescription>
                </DialogHeader>


                {/* create new event form */}





                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>

            </DialogContent>






        </Dialog>
    )
}


export default CalanderCell;