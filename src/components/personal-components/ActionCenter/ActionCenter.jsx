"use client";

import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getActionCenterData } from "@/actions/actionCenter";
import { resolveBadgeStatus } from "@/actions/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ActionCenter() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
                <p className="text-muted-foreground mt-2">Manage and resolve all incoming resource requests.</p>
            </div>

            <div className="border rounded-md shadow-sm bg-background">
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
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
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
        </div>
    );
}