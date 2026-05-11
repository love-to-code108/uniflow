"use server";
import { db } from "@/lib/db";
import { withAuthOnly } from "@/actions/gatekeeper";

export async function getCalendarData(year, month) {
    try {
        // --- THE GRID MATH UPGRADE ---
        // We replicate the frontend's exact 35/42 day grid logic to include padded days.
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const startOffset = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

        // The absolute first day visible on the calendar grid (e.g., April 26th for May's grid)
        const gridStartDate = new Date(firstDayOfMonth);
        gridStartDate.setDate(firstDayOfMonth.getDate() - startOffset);
        gridStartDate.setHours(0, 0, 0, 0);

        // Determine if the frontend will render 35 or 42 cells
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const totalSlotsNeeded = startOffset + lastDayOfMonth;
        const numCells = totalSlotsNeeded <= 35 ? 35 : 42;

        // The absolute last day visible on the calendar grid
        const gridEndDate = new Date(gridStartDate);
        gridEndDate.setDate(gridStartDate.getDate() + numCells - 1);
        gridEndDate.setHours(23, 59, 59, 999);
        // -----------------------------

        // Run all three queries in parallel for maximum speed
        const [events, vehicles, guests] = await Promise.all([
            db.event.findMany({
                where: { date: { gte: gridStartDate, lte: gridEndDate } },
                select: { id: true, name: true, date: true, startTime: true, endTime: true, status: true }
            }),
            db.vehicleRequest.findMany({
                where: { date: { gte: gridStartDate, lte: gridEndDate } },
                include: { vehicle: true } 
            }),
            db.guestRoomRequest.findMany({
                // Guests might check in last month and check out this month, so we check for overlap
                where: {
                    checkInDate: { lte: gridEndDate },
                    checkOutDate: { gte: gridStartDate }
                },
                include: { room: true } 
            })
        ]);

        const groupedData = {};

        // Helper to format date keys safely for local time zone
        const createDateKey = (dateObject) => {
            const d = new Date(dateObject);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        // 1. Map Events
        events.forEach(evt => {
            const dateKey = createDateKey(evt.date);
            if (!groupedData[dateKey]) groupedData[dateKey] = [];
            groupedData[dateKey].push({
                id: evt.id,
                type: "event",
                title: evt.name,
                startTime: evt.startTime,
                endTime: evt.endTime,
                status: evt.status
            });
        });

        // 2. Map Vehicles
        vehicles.forEach(veh => {
            const dateKey = createDateKey(veh.date);
            if (!groupedData[dateKey]) groupedData[dateKey] = [];
            groupedData[dateKey].push({
                id: veh.id,
                type: "vehicle",
                title: veh.vehicle?.name || "Vehicle Request",
                startTime: veh.startTime,
                endTime: veh.endTime,
                status: veh.status
            });
        });

        // 3. Map Guests (Creates a badge for EVERY day of their stay)
        guests.forEach(guest => {
            const start = new Date(guest.checkInDate);
            const end = new Date(guest.checkOutDate);
            
            // Loop through every day from Check-In to Check-Out
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // Ensure we only create badges for days that are actually visible on THIS grid
                if (d >= gridStartDate && d <= gridEndDate) {
                    const dateKey = createDateKey(d);
                    if (!groupedData[dateKey]) groupedData[dateKey] = [];
                    groupedData[dateKey].push({
                        id: guest.id,
                        type: "guest",
                        title: `Guest: ${guest.room?.name || "Room"}`,
                        status: guest.status
                    });
                }
            }
        });

        return { status: "SUCCESS", data: groupedData };

    } catch (error) {
        console.error("Error fetching calendar data:", error);
        return { status: "ERROR", message: "Failed to fetch calendar data." };
    }
}




// Add this to the bottom of src/actions/calendar.js

export async function getBadgeDetails(id, type) {
    try {
        let data = null;

        if (type === "event") {
            data = await db.event.findUnique({
                where: { id },
                // --- ADD venue: true HERE ---
                include: { 
                    user: { select: { name: true, username: true } },
                    venue: true 
                }
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

            const isApproved = existing.status === "approved";
            
            // 1. Everyone with edit rights can change basic text
            let dataToUpdate = {
                name: updateData.title,
                description: updateData.description,
            };

            // 2. Schedule logic: Requesters can edit if pending. Admins can edit anytime.
            if (canApprove || !isApproved) {
                dataToUpdate.date = new Date(updateData.eventDate);
                dataToUpdate.startTime = updateData.startTime;
                dataToUpdate.endTime = updateData.endTime;
            }

            // 3. Venue logic: ONLY Admins can ever edit the venue
            if (canApprove && updateData.venueId) {
                dataToUpdate.venueId = updateData.venueId;
            }

            // Execute the update
            updatedRecord = await db.event.update({
                where: { id },
                data: dataToUpdate,
                include: { 
                    user: { select: { name: true, username: true } },
                    venue: true // <-- CRITICAL FIX: This stops Shadcn from glitching the ID on save!
                }
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
const processBadgeResolution = async (userId, id, type, newStatus, expectedStatus) => {
    try {
        // Fetch the user's current permissions
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        if (!user) return { status: "ERROR", message: "User not found." };

        let updatedRecord = null;

        // --- THE RACE CONDITION CHECKER ---
        // This ensures Admin B doesn't accidentally delete something Admin A just approved!
        const checkRaceCondition = (existingStatus) => {
            if (expectedStatus && existingStatus !== expectedStatus) {
                return true;
            }
            return false;
        };

        // Route to the correct table
        if (type === "event") {
            if (user.permissions?.can_approve_events !== true) return { status: "ERROR", message: "Unauthorized." };

            const existing = await db.event.findUnique({ where: { id } });
            if (!existing) return { status: "ERROR", message: "Record not found." };
            if (checkRaceCondition(existing.status)) return { status: "ERROR", message: `Record already modified by another admin (Currently: ${existing.status}).` };

            if (newStatus === "declined") {
                // DELETE PROTOCOL
                await db.event.delete({ where: { id } });
                return { status: "SUCCESS", data: null };
            } else {
                updatedRecord = await db.event.update({
                    where: { id },
                    data: { status: newStatus },
                    include: { 
                        user: { select: { name: true, username: true } },
                        venue: true // <-- THE FIX: Send the venue data back to the UI!
                    }
                });
            }
        } 
        else if (type === "vehicle") {
            if (user.permissions?.can_approve_vehicles !== true) return { status: "ERROR", message: "Unauthorized." };

            const existing = await db.vehicleRequest.findUnique({ where: { id } });
            if (!existing) return { status: "ERROR", message: "Record not found." };
            if (checkRaceCondition(existing.status)) return { status: "ERROR", message: `Record already modified by another admin (Currently: ${existing.status}).` };

            if (newStatus === "declined") {
                await db.vehicleRequest.delete({ where: { id } });
                return { status: "SUCCESS", data: null };
            } else {
                updatedRecord = await db.vehicleRequest.update({
                    where: { id },
                    data: { status: newStatus },
                    include: { user: { select: { name: true, username: true } }, vehicle: true }
                });
            }
        } 
        else if (type === "guest") {
            if (user.permissions?.can_approve_guests !== true) return { status: "ERROR", message: "Unauthorized." };

            const existing = await db.guestRoomRequest.findUnique({ where: { id } });
            if (!existing) return { status: "ERROR", message: "Record not found." };
            if (checkRaceCondition(existing.status)) return { status: "ERROR", message: `Record already modified by another admin (Currently: ${existing.status}).` };

            if (newStatus === "declined") {
                await db.guestRoomRequest.delete({ where: { id } });
                return { status: "SUCCESS", data: null };
            } else {
                updatedRecord = await db.guestRoomRequest.update({
                    where: { id },
                    data: { status: newStatus },
                    include: { user: { select: { name: true, username: true } }, room: true }
                });
            }
        }

        return { status: "SUCCESS", data: updatedRecord };

    } catch (error) {
        console.error("Error resolving badge status:", error);
        return { status: "ERROR", message: "Failed to process the resolution in the database." };
    }
};

// 2. The Wrapped Export (Uses your gatekeeper!)
export async function resolveBadgeStatus(id, type, newStatus, expectedStatus) {
    try {
        const secureAction = await withAuthOnly(processBadgeResolution);
        return await secureAction(id, type, newStatus, expectedStatus);
    } catch (error) {
        console.error("Action Wrapper Error:", error);
        return { status: "ERROR", message: "Failed to authenticate resolution request." };
    }
}



export const getPublicEvents = async (year, month) => {
    try {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        const events = await db.event.findMany({
            where: {
                date: { gte: startOfMonth, lte: endOfMonth },
                status: "approved" // STRICTLY ONLY APPROVED EVENTS
            },
            select: {
                id: true,
                name: true,
                description: true,
                date: true,
                startTime: true,
                endTime: true,
                venue: {
                    select: { name: true }
                },
                registrationLink: true,
            }
        });

        const groupedData = {};
        events.forEach(event => {
            const dateKey = event.date.toISOString().split('T')[0];
            if (!groupedData[dateKey]) groupedData[dateKey] = [];
            
            groupedData[dateKey].push({
                id: event.id,
                title: event.name,
                type: "event",
                startTime: event.startTime,
                endTime: event.endTime,
                status: "approved",
                description: event.description,
                venue: event.venue?.name,
                registrationLink: event.registrationLink,
                date: event.date
            });
        });

        return { status: "SUCCESS", data: groupedData };
    } catch (error) {
        console.error("Public fetch error:", error);
        return { status: "ERROR", message: "Failed to fetch public events." };
    }
}



// Add this at the bottom of the file
export async function getAllVenues() {
    try {
        const venues = await db.venue.findMany({
            orderBy: { capacity: 'asc' } // Sorts from smallest to largest
        });
        return { status: "SUCCESS", data: venues };
    } catch (error) {
        console.error("Failed to fetch venues:", error);
        return { status: "ERROR", message: "Failed to load venues." };
    }
}



// Add this to the bottom of src/actions/calendar.js

const processCreateVenue = async (userId, venueData) => {
    try {
        // 1. Verify the user has the specific system management permission
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        if (user?.permissions?.can_manage_system !== true) {
            return { status: "ERROR", message: "Unauthorized: You do not have system management privileges." };
        }

        // 2. Check if a venue with this exact name already exists
        const existingVenue = await db.venue.findUnique({
            where: { name: venueData.name }
        });

        if (existingVenue) {
            return { status: "ERROR", message: "A venue with this name already exists in the system." };
        }

        // 3. Create the new venue
        await db.venue.create({
            data: {
                name: venueData.name,
                capacity: parseInt(venueData.capacity),
            }
        });

        return { status: "SUCCESS", message: `Venue '${venueData.name}' created successfully!` };

    } catch (error) {
        console.error("Error creating venue:", error);
        return { status: "ERROR", message: "Failed to create the new venue." };
    }
};

export async function createNewVenue(venueData) {
    try {
        const secureAction = await withAuthOnly(processCreateVenue);
        return await secureAction(venueData);
    } catch (error) {
        console.error("Action Wrapper Error:", error);
        return { status: "ERROR", message: "Failed to process venue creation request." };
    }
}