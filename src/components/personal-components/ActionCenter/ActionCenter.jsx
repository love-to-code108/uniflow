"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { getActionCenterData } from "@/actions/actionCenter";
import { resolveBadgeStatus } from "@/actions/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import {
    CreateEventForm,
    CreateVehicleForm,
    CreateGuestForm
} from "@/components/personal-components/Calander/calanderCell";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";



export default function ActionCenter() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Search & Filter States ---
    // --- Search & Filter States ---
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Statuses"); // Updated
    const [typeFilter, setTypeFilter] = useState("All Categories");   // Updated
    const [sortOrder, setSortOrder] = useState("Event Date (Oldest First)"); // Updated

    // --- Inline Editing State ---
    const [editingItem, setEditingItem] = useState(null);
    // --- NEW: Decline Confirmation State ---
    const [decliningItem, setDecliningItem] = useState(null);

    const loadData = async () => {
        setIsLoading(true);
        const res = await getActionCenterData();
        if (res.status === "SUCCESS") {
            setData(res.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleResolve = async (id, type, newStatus, currentStatus) => {
        const res = await resolveBadgeStatus(id, type, newStatus, currentStatus);
        if (res.status === "SUCCESS") {
            toast.success(`${type} request ${newStatus}!`);
            loadData(); // Instantly refresh the table
        } else {
            toast.error(res.message);
        }
    };

    // --- The Client-Side Search Engine ---
    // --- The Client-Side Search Engine ---
    const filteredAndSortedData = useMemo(() => {
        let result = [...data];

        // 1. Search Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(lowerSearch) ||
                (item.user?.name || item.user?.username || "").toLowerCase().includes(lowerSearch)
            );
        }

        // 2. Status Filter (Translates UI text to DB status)
        if (statusFilter !== "All Statuses") {
            const mappedStatus = statusFilter === "Pending Only" ? "pending" : statusFilter.toLowerCase();
            result = result.filter(item => item.status === mappedStatus);
        }

        // 3. Category Filter (Translates UI text to DB type)
        if (typeFilter !== "All Categories") {
            const mappedType = typeFilter === "Events" ? "event" :
                typeFilter === "Vehicles" ? "vehicle" :
                    typeFilter === "Guests" ? "guest" : "all";
            result = result.filter(item => item.type === mappedType);
        }

        // 4. Sorting Logic
        result.sort((a, b) => {
            const dateA = new Date(a.sortDate).getTime();
            const dateB = new Date(b.sortDate).getTime();

            if (sortOrder === "Event Date (Oldest First)") return dateA - dateB;
            if (sortOrder === "Event Date (Newest First)") return dateB - dateA;
            return 0;
        });

        return result;
    }, [data, searchTerm, statusFilter, typeFilter, sortOrder]);



    if (isLoading) {
        return (
            <div className="w-full h-[80vh] flex justify-center items-center">
                <Loader2 className="animate-spin text-muted-foreground h-10 w-10" />
            </div>
        );
    }

    return (
        <div className="w-full p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Action Center</h2>
                <p className="text-muted-foreground mt-2">Manage, filter, and resolve all incoming resource requests.</p>
            </div>


            {/* --- The Filters Bar (Shadcn UI) --- */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">

                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <Label htmlFor="search">Search Requests</Label>
                    <Input
                        id="search"
                        placeholder="Title or Faculty Coordinator..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-[300px] bg-background"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Statuses">All Statuses</SelectItem>
                            <SelectItem value="Pending Only">Pending Only</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Declined">Declined</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Category</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Categories">All Categories</SelectItem>
                            <SelectItem value="Events">Events</SelectItem>
                            <SelectItem value="Vehicles">Vehicles</SelectItem>
                            <SelectItem value="Guests">Guests</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Sort By</Label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-[240px] bg-background">
                            <SelectValue placeholder="Sort by Date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Event Date (Oldest First)">Event Date (Oldest First)</SelectItem>
                            <SelectItem value="Event Date (Newest First)">Event Date (Newest First)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* --- The Data Table (Shadcn UI) --- */}
            <div className="border rounded-md shadow-sm bg-background overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Faculty Coordinator</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No requests match your current filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedData.map((item) => (
                                <TableRow key={`${item.type}-${item.id}`}>
                                    <TableCell className="font-medium capitalize">{item.type}</TableCell>
                                    <TableCell>{item.title}</TableCell>
                                    <TableCell>{item.user?.name || item.user?.username || "Unknown"}</TableCell>
                                    <TableCell>
                                        {new Date(item.sortDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                            item.status === "pending" ? "bg-gray-500 text-white" :
                                                item.status === "approved" ? "bg-[#36EA5C] text-white" : "bg-red-500 text-white"
                                        )}>
                                            {item.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.status === "pending" && (
                                            <div className="flex justify-end gap-2">
                                                {/* Edit Trigger */}
                                                <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>
                                                    Edit
                                                </Button>

                                                {/* --- Change this section inside your table --- */}
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setDecliningItem(item)} // Changed this line!
                                                >
                                                    Decline
                                                </Button>
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleResolve(item.id, item.type, "approved", item.status)}>
                                                    Approve
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- The Edit Modal (Shadcn UI) --- */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="capitalize">Edit {editingItem?.type} Request</DialogTitle>
                        <DialogDescription>
                            Make changes to this request before approving it.
                        </DialogDescription>
                    </DialogHeader>

                    {/* --- THE DYNAMIC FORMS --- */}
                    {editingItem?.type === "event" && (
                        <CreateEventForm
                            initialData={editingItem}
                            onSuccess={() => {
                                setEditingItem(null);
                                loadData(); // Refresh table after edit
                            }}
                        />
                    )}

                    {editingItem?.type === "vehicle" && (
                        <CreateVehicleForm
                            initialData={editingItem}
                            onSuccess={() => {
                                setEditingItem(null);
                                loadData();
                            }}
                        />
                    )}

                    {editingItem?.type === "guest" && (
                        <CreateGuestForm
                            initialData={editingItem}
                            onSuccess={() => {
                                setEditingItem(null);
                                loadData();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>


            {/* --- The Decline Confirmation Modal (Shadcn UI) --- */}
            <AlertDialog open={!!decliningItem} onOpenChange={(open) => !open && setDecliningItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will officially decline the <span className="capitalize font-bold">{decliningItem?.type}</span> request from <span className="font-bold">{decliningItem?.user?.name || decliningItem?.user?.username || "Unknown"}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                                if (decliningItem) {
                                    handleResolve(decliningItem.id, decliningItem.type, "declined", decliningItem.status);
                                    setDecliningItem(null); // Close the modal after clicking
                                }
                            }}
                        >
                            Yes, Decline Request
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}