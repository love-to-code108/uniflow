"use client"

import { ChevronDown, Plus, WindArrowDown } from "lucide-react" // For the arrow icon

// Import Dropdown Menu components
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import Sidebar components (Ensure these are already installed/imported)
import {
    SidebarGroupAction,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Orbit } from 'lucide-react';


import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
// import { Button } from "./ui/button";

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Form from "./personal-components/forms/CreateNewUserForm";





export function AppSidebar() {



    const addUser = () => {


    }





    return (
        <Sidebar collapsible="icon">


            {/* the header */}
            <SidebarHeader className={"mt-2"}>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className=" flex justify-start items-center">




                            {/* the company logo */}
                            <div className=" flex">
                                <div className=" mr-2 bg-orange-600 p-1 rounded-sm aspect-square flex justify-center items-center">
                                    <Orbit />
                                </div>

                                {/* company name */}
                                <div className="flex flex-col ">
                                    <h1 className=" text-xl font-bold leading-[25px]">Uniflow</h1>
                                    <p className="text-xs leading-[10px] w-[100px]">Resource Portal</p>
                                </div>
                            </div>



                            <div className=" w-full flex justify-end">
                            </div>
                        </div>

                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>



            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Actions
                    </SidebarGroupLabel>

                    <SidebarMenu>
                        <SidebarMenuItem>
                            {/* <SidebarMenuButton onClick={addUser}>
                                <div className="w-full flex items-center justify-between hover:cursor-pointer">
                                    <p>Add User</p>
                                    <Plus/>
                                </div>
                            </SidebarMenuButton> */}


                            <Dialog>
                                <DialogTrigger asChild className={"w-full h-full "}>
                                    <SidebarMenuButton className={"hover:cursor-pointer"}>
                                        <div className="w-full flex items-center justify-between">
                                            <p>Add User</p>
                                            <Plus />
                                        </div>
                                    </SidebarMenuButton>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add new user</DialogTitle>
                                        <DialogDescription>
                                            This will create a new user in the database.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <Form/>
                                </DialogContent>
                            </Dialog>




                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}