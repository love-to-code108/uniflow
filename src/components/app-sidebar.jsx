"use client"

import { 
    Plus, 
    LogOut, 
    CalendarIcon, 
    TableProperties, 
    Users, 
    Car, 
    BedDouble, 
    Orbit,
    MapPin
} from "lucide-react"

import {
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    Sidebar,
    SidebarContent,
    SidebarGroup
} from "@/components/ui/sidebar"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Form from "./personal-components/forms/CreateNewUserForm";

import { useAuthStore, useAppStore } from "@/store/globalStates"; 
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/userAuth";
import CreateNewVenueForm from "./personal-components/forms/CreateNewVenueForm";

export function AppSidebar() {
    // --- AUTH & PERMISSIONS ---
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const permissions = user?.permissions || {};

    // Determine what groups this specific user is allowed to see
    const canSeeActionCenter = permissions.can_approve_events || permissions.can_approve_vehicles || permissions.can_approve_guests;
    // Assuming you have a permission flag for managing users/resources. If not, you can tie this to a specific admin role.
    const canManageResources = permissions.can_create_users || permissions.can_manage_system;

    const router = useRouter();

    // --- VIEW ROUTING STATE ---
    const currentView = useAppStore((state) => state.currentView);
    const setCurrentView = useAppStore((state) => state.setCurrentView);

    const handleLogout = async () => {
        await logoutUser(); 
        logout(); 
        router.push("/login"); 
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className={"mt-2"}>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex justify-start items-center">
                            <div className="flex">
                                <div className="mr-2 bg-orange-600 p-1 rounded-sm aspect-square flex justify-center items-center">
                                    <Orbit />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-xl font-bold leading-[25px]">Uniflow</h1>
                                    <p className="text-xs leading-[10px] w-[100px]">Resource Portal</p>
                                </div>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                
                {/* --- GROUP 1: VIEWS --- */}
                <SidebarGroup>
                    <SidebarGroupLabel>Views</SidebarGroupLabel>
                    <SidebarMenu>
                        
                        {/* Everyone gets the Calendar */}
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                onClick={() => setCurrentView("calendar")}
                                isActive={currentView === "calendar"}
                                className="hover:cursor-pointer"
                            >
                                <div className="w-full flex items-center gap-3">
                                    <CalendarIcon size={16} />
                                    <p>Calendar</p>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        {/* Only Approvers get the Action Center */}
                        {canSeeActionCenter && (
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    onClick={() => setCurrentView("action-center")}
                                    isActive={currentView === "action-center"}
                                    className="hover:cursor-pointer"
                                >
                                    <div className="w-full flex items-center gap-3">
                                        <TableProperties size={16} />
                                        <p>Action Center</p>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}

                        {/* Only System Managers get the User Directory */}
                        {canManageResources && (
                            <SidebarMenuItem>
                                <SidebarMenuButton className="hover:cursor-pointer text-muted-foreground">
                                    <div className="w-full flex items-center gap-3">
                                        <Users size={16} />
                                        <p>User Directory</p>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}

                    </SidebarMenu>
                </SidebarGroup>




                {/* --- GROUP 2: MANAGEMENT (Conditionally Rendered) --- */}
                {canManageResources && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Management</SidebarGroupLabel>
                        <SidebarMenu>
                            
                            <SidebarMenuItem>
                                <Dialog>
                                    <DialogTrigger asChild className={"w-full h-full"}>
                                        <SidebarMenuButton className={"hover:cursor-pointer"}>
                                            <div className="w-full flex items-center gap-3">
                                                <Plus size={16} />
                                                <p>Add User</p>
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

                            <SidebarMenuItem>
                                <SidebarMenuButton className="hover:cursor-pointer text-muted-foreground">
                                    <div className="w-full flex items-center gap-3">
                                        <Car size={16} />
                                        <p>Add Vehicle</p>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton className="hover:cursor-pointer text-muted-foreground">
                                    <div className="w-full flex items-center gap-3">
                                        <BedDouble size={16} />
                                        <p>Add Guest Room</p>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>







                            {/* --- CONDITIONAL: ADD VENUE (System Managers Only) --- */}
                            {permissions.can_manage_system && (
                                <SidebarMenuItem>
                                    <Dialog>
                                        <DialogTrigger asChild className={"w-full h-full"}>
                                            <SidebarMenuButton className={"hover:cursor-pointer"}>
                                                <div className="w-full flex items-center gap-3">
                                                    <MapPin size={16} />
                                                    <p>Add Venue</p>
                                                </div>
                                            </SidebarMenuButton>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add a New Venue</DialogTitle>
                                                <DialogDescription>
                                                    Register a new physical space and define its strict seating capacity for event scheduling.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <CreateNewVenueForm />
                                        </DialogContent>
                                    </Dialog>
                                </SidebarMenuItem>
                            )}

                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* --- UNIVERSAL LOGOUT --- */}
                {/* Placed outside the management group so everyone can log out */}
                <SidebarGroup className="mt-auto">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                onClick={handleLogout} 
                                className={"hover:cursor-pointer text-red-500 hover:text-red-600 transition-colors"}
                            >
                                <div className="w-full flex items-center gap-3">
                                    <LogOut size={16} />
                                    <p>Logout</p>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

            </SidebarContent>
        </Sidebar>
    )
}