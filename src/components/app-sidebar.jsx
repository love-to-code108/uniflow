"use client"

import { ChevronDown } from "lucide-react" // For the arrow icon

// Import Dropdown Menu components
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import Sidebar components (Ensure these are already installed/imported)
import {
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Orbit } from 'lucide-react';


import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon">


            {/* the header */}
            <SidebarHeader className={"mt-2"}>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className=" flex justify-start items-center">

                            {/* logo of uniflow */}
                            <div className=" mr-2 bg-orange-600 p-1 rounded-sm aspect-square">
                                <Orbit />
                            </div>

                            {/* uniflow name */}
                            <div className="flex flex-col ">
                                <h1 className=" text-xl font-bold leading-[25px]">Uniflow</h1>    
                                <p className="text-xs leading-[10px] w-[100px]">Resource Portal</p>
                            </div>


                            <div className=" w-full flex justify-end">
                                <SidebarTrigger />
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>



            <SidebarContent>
                <SidebarGroup>
                    Calander
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}