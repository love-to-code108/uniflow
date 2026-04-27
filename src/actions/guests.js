"use server";

import { db } from "@/lib/db";
import { withPermissions } from "@/actions/gatekeeper"; 

const processGuestRequest = async (userId, formData, flags = {}) => {
    try {
        const {
            roomId,
            checkInDate, 
            checkOutDate, 
            guestName,
            purpose
        } = formData;

        // --- THE TIME MACHINE BLOCKER ---
        const now = new Date();
        const todayMidnight = new Date(now);
        todayMidnight.setHours(0, 0, 0, 0);
        
        const targetCheckIn = new Date(checkInDate);
        targetCheckIn.setHours(0, 0, 0, 0);

        if (targetCheckIn < todayMidnight) {
            return { status: "ERROR", message: "Cannot request a room for a past date." };
        }

        // Ensure check-out is logically after check-in
        if (new Date(checkOutDate) <= targetCheckIn) {
            return { status: "ERROR", message: "Check-out date must be after the check-in date." };
        }
        // --------------------------------

        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        const hasPriority = user?.permissions?.has_priority === true;

        const createPendingGuestRequest = async () => {
            await db.guestRoomRequest.create({
                data: {
                    userId: userId,
                    roomId: roomId,
                    checkInDate: checkInDate,
                    checkOutDate: checkOutDate,
                    guestName: guestName,
                    purpose: purpose,
                    status: "pending" 
                }
            });
        };

        if (hasPriority) {
            await createPendingGuestRequest();
            return { status: "SUCCESS" };
        }

        // --- THE PHANTOM BOOKING BLOCKER (Date Overlap) ---
        const overlappingRequests = await db.guestRoomRequest.findMany({
            where: {
                roomId: roomId,
                status: { in: ["pending", "approved"] }, 
                AND: [
                    // Logic: The new stay starts before the existing stay ends, 
                    // AND the new stay ends after the existing stay starts.
                    { checkInDate: { lt: checkOutDate } }, 
                    { checkOutDate: { gt: checkInDate } }  
                ]
            }
        });

        if (overlappingRequests.length > 0) {
            return { 
                status: "ERROR", 
                message: "This room is already booked for these dates. Please select a different room." 
            };
        }
        // -----------------------------------

        await createPendingGuestRequest();
        return { status: "SUCCESS" };

    } catch (error) {
        console.error("Error creating guest request:", error);
        return { status: "ERROR", message: "Internal Server Error" };
    }
};

// --------------------------------------------------------
// THE MAGIC GATEKEEPER
// Demands the "can_request_guest_room" permission.
// --------------------------------------------------------
export async function submitGuestRequest(formData, flags = {}) {
    try {
        const secureAction = await withPermissions("can_request_guest_room", processGuestRequest);
        return await secureAction(formData, flags);
    } catch (error) {
        console.error("Action Wrapper Error:", error);
        return { status: "ERROR", message: "Failed to process guest room request." };
    }
}