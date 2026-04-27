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

export default function ActionCenter() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Search & Filter States ---
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("dateAsc");

    // --- Inline Editing State ---
    const [editingItem, setEditingItem] = useState(null);

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
    const filteredAndSortedData = useMemo(() => {
        let result = [...data];

        // 1. Search Filter (Faculty Coordinator Name or Title)
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(lowerSearch) ||
                (item.user?.name || item.user?.username || "").toLowerCase().includes(lowerSearch)
            );
        }

        // 2. Status Filter
        if (statusFilter !== "all") {
            result = result.filter(item => item.status === statusFilter);
        }

        // 3. Category Filter
        if (typeFilter !== "all") {
            result = result.filter(item => item.type === typeFilter);
        }

        // 4. Sorting Logic
        result.sort((a, b) => {
            const dateA = new Date(a.sortDate).getTime();
            const dateB = new Date(b.sortDate).getTime();

            if (sortOrder === "dateAsc") return dateA - dateB;
            if (sortOrder === "dateDesc") return dateB - dateA;
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
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input
                    placeholder="Search by Title or Faculty Coordinator..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-[300px] bg-background"
                />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending Only</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="event">Events</SelectItem>
                        <SelectItem value="vehicle">Vehicles</SelectItem>
                        <SelectItem value="guest">Guests</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[220px] bg-background">
                        <SelectValue placeholder="Sort by Date" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dateAsc">Event Date (Oldest First)</SelectItem>
                        <SelectItem value="dateDesc">Event Date (Newest First)</SelectItem>
                    </SelectContent>
                </Select>
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

                                                <Button size="sm" variant="destructive" onClick={() => handleResolve(item.id, item.type, "declined", item.status)}>
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="capitalize">Edit {editingItem?.type} Request</DialogTitle>
                        <DialogDescription>
                            Make changes to this request before approving it.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Placeholder for the edit forms. We will map this to the specific forms next! */}
                    <div className="py-6 text-center text-muted-foreground border-2 border-dashed rounded-md">
                        <p>The {editingItem?.type} edit form will render here.</p>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}