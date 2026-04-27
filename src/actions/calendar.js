"use server";
import { db } from "@/lib/db";
import { withAuthOnly } from "@/actions/gatekeeper";

export async function getCalendarData(year, month) {
    try {
        // Create boundaries for the current month
        // Note: JavaScript months are 0-indexed in the Date constructor (0 = Jan, 11 = Dec)
        // We assume the frontend passes month as 1-12
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Run all three queries in parallel for maximum speed
        const [events, vehicles, guests] = await Promise.all([
            db.event.findMany({
                where: { date: { gte: startDate, lte: endDate } },
                // ADD endTime: true RIGHT HERE
                select: { id: true, name: true, date: true, startTime: true, endTime: true, status: true }
            }),
            db.vehicleRequest.findMany({
                where: { date: { gte: startDate, lte: endDate } },
                include: { vehicle: true } // Pulls in the semantic vehicle name
            }),
            db.guestRoomRequest.findMany({
                // Guests might check in last month and check out this month, so we check for overlap
                where: {
                    checkInDate: { lte: endDate },
                    checkOutDate: { gte: startDate }
                },
                include: { room: true } // Pulls in the semantic room name
            })
        ]);

        const groupedData = {};

        // Helper function to push data into our grouped dictionary
        const addToDate = (dateObj, item) => {
            // Format to YYYY-MM-DD to use as the dictionary key
            const dateKey = dateObj.toISOString().split('T')[0];
            if (!groupedData[dateKey]) groupedData[dateKey] = [];
            groupedData[dateKey].push(item);
        };

        // 1. Process Events
        events.forEach(ev => {
            addToDate(ev.date, {
                id: ev.id,
                type: "event",
                title: ev.name,
                startTime: ev.startTime, // Changed from 'time'
                endTime: ev.endTime,     // NEW
                status: ev.status
            });
        });

        // 2. Process Vehicles
        vehicles.forEach(veh => {
            addToDate(veh.date, {
                id: veh.id,
                type: "vehicle",
                title: veh.vehicle?.name || "Vehicle Request",
                startTime: veh.startTime, // Changed from 'time'
                endTime: veh.endTime,     // NEW
                status: veh.status
            });
        });

        // 3. Process Guest Rooms (Multi-day span)
        guests.forEach(guest => {
            // We loop through the days they are staying to put a block on each calendar day
            let currentDate = new Date(guest.checkInDate);
            const checkOut = new Date(guest.checkOutDate);

            while (currentDate <= checkOut) {
                // Only add to the dictionary if the date falls within the month we are looking at
                if (currentDate >= startDate && currentDate <= endDate) {
                    addToDate(currentDate, {
                        id: guest.id,
                        type: "guest",
                        title: `${guest.room?.name} (${guest.guestName})`,
                        status: guest.status
                    });
                }
                // Move to the next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        return { status: "SUCCESS", data: groupedData };

    } catch (error) {
        console.error("Error fetching calendar data:", error);
        return { status: "ERROR", message: "Failed to load calendar data." };
    }
}




// Add this to the bottom of src/actions/calendar.js

export async function getBadgeDetails(id, type) {
    try {
        let data = null;

        if (type === "event") {
            data = await db.event.findUnique({
                where: { id },
                include: { user: { select: { name: true, username: true } } }
            });
        }
        else if (type === "vehicle") {
            data = await db.vehicleRequest.findUnique({
                where: { id },
                include: {
                    user: { select: { name: true, username: true } },
                    vehicle: true
                }
            });
        }
        else if (type === "guest") {
            data = await db.guestRoomRequest.findUnique({
                where: { id },
                include: {
                    user: { select: { name: true, username: true } },
                    room: true
                }
            });
        }

        if (!data) return { status: "ERROR", message: "Record not found." };

        return { status: "SUCCESS", data };

    } catch (error) {
        console.error("Error fetching badge details:", error);
        return { status: "ERROR", message: "Failed to load details." };
    }
}






// 1. The Core Logic
const processBadgeUpdate = async (userId, id, type, updateData) => {
    try {
        // Fetch the user's current permissions
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        if (!user) return { status: "ERROR", message: "User not found." };

        let updatedRecord = null;

        if (type === "event") {
            // SECURITY CHECK: Fetch the existing record to check ownership
            const existing = await db.event.findUnique({ where: { id } });
            if (!existing) return { status: "ERROR", message: "Event not found." };

            const isCreator = existing.userId === userId;
            const canApprove = user.permissions?.can_approve_events === true;

            if (!isCreator && !canApprove) {
                return { status: "ERROR", message: "Unauthorized to edit this event." };
            }

            // Execute the update
            updatedRecord = await db.event.update({
                where: { id },
                data: {
                    name: updateData.title,
                    description: updateData.description,
                    date: new Date(updateData.eventDate),
                    startTime: updateData.startTime,
                    endTime: updateData.endTime,
                },
                include: { user: { select: { name: true, username: true } } }
            });
        } 
        else if (type === "vehicle") {
            const existing = await db.vehicleRequest.findUnique({ where: { id } });
            if (!existing) return { status: "ERROR", message: "Vehicle request not found." };

            const isCreator = existing.userId === userId;
            const canApprove = user.permissions?.can_approve_vehicles === true;

            if (!isCreator && !canApprove) {
                return { status: "ERROR", message: "Unauthorized to edit this request." };
            }

            updatedRecord = await db.vehicleRequest.update({
                where: { id },
                data: {
                    destination: updateData.destination,
                    purpose: updateData.purpose,
                    date: new Date(updateData.eventDate),
                    startTime: updateData.startTime,
                    endTime: updateData.endTime,
                },
                include: { user: { select: { name: true, username: true } }, vehicle: true }
            });
        } 
        else if (type === "guest") {
            const existing = await db.guestRoomRequest.findUnique({ where: { id } });
            if (!existing) return { status: "ERROR", message: "Guest request not found." };

            const isCreator = existing.userId === userId;
            const canApprove = user.permissions?.can_approve_guests === true;

            if (!isCreator && !canApprove) {
                return { status: "ERROR", message: "Unauthorized to edit this request." };
            }

            updatedRecord = await db.guestRoomRequest.update({
                where: { id },
                data: {
                    purpose: updateData.purpose,
                    checkInDate: new Date(updateData.checkInDate),
                    checkOutDate: new Date(updateData.checkOutDate),
                },
                include: { user: { select: { name: true, username: true } }, room: true }
            });
        }

        return { status: "SUCCESS", data: updatedRecord };

    } catch (error) {
        console.error("Error updating badge details:", error);
        return { status: "ERROR", message: "Failed to update the database." };
    }
};

// 2. The Wrapped Export
export async function updateBadgeDetails(id, type, updateData) {
    try {
        const secureAction = await withAuthOnly(processBadgeUpdate);
        return await secureAction(id, type, updateData);
    } catch (error) {
        console.error("Action Wrapper Error:", error);
        return { status: "ERROR", message: "Failed to process update." };
    }
}



// 1. The Core Resolution Logic
const processBadgeResolution = async (userId, id, type, newStatus) => {
    try {
        // Fetch the user's current permissions
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        if (!user) return { status: "ERROR", message: "User not found." };

        let updatedRecord = null;

        // Route to the correct table and check exact permissions
        if (type === "event") {
            if (user.permissions?.can_approve_events !== true) {
                return { status: "ERROR", message: "Unauthorized to approve events." };
            }
            updatedRecord = await db.event.update({
                where: { id },
                data: { status: newStatus },
                include: { user: { select: { name: true, username: true } } }
            });
        } 
        else if (type === "vehicle") {
            if (user.permissions?.can_approve_vehicles !== true) {
                return { status: "ERROR", message: "Unauthorized to approve vehicles." };
            }
            updatedRecord = await db.vehicleRequest.update({
                where: { id },
                data: { status: newStatus },
                include: { user: { select: { name: true, username: true } }, vehicle: true }
            });
        } 
        else if (type === "guest") {
            if (user.permissions?.can_approve_guests !== true) {
                return { status: "ERROR", message: "Unauthorized to approve guest rooms." };
            }
            updatedRecord = await db.guestRoomRequest.update({
                where: { id },
                data: { status: newStatus },
                include: { user: { select: { name: true, username: true } }, room: true }
            });
        }

        return { status: "SUCCESS", data: updatedRecord };

    } catch (error) {
        console.error("Error resolving badge status:", error);
        return { status: "ERROR", message: "Failed to update the database." };
    }
};

// 2. The Wrapped Export
export async function resolveBadgeStatus(id, type, newStatus) {
    try {
        const secureAction = await withAuthOnly(processBadgeResolution);
        return await secureAction(id, type, newStatus);
    } catch (error) {
        console.error("Action Wrapper Error:", error);
        return { status: "ERROR", message: "Failed to process resolution." };
    }
}