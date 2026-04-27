"use server";

import { db } from "@/lib/db";
import { withPermissions } from "@/actions/gatekeeper"; 

// 1. The Core Logic
const processVehicleRequest = async (userId, formData, flags = {}) => {
    try {
        const {
            vehicleId,
            eventDate, // This is the safe 12:00 PM date we set on the frontend
            startTime,
            endTime,
            destination,
            purpose
        } = formData;

        // --- THE TIME MACHINE BLOCKER ---
        const now = new Date();
        const todayMidnight = new Date(now);
        todayMidnight.setHours(0, 0, 0, 0);
        
        const targetDateMidnight = new Date(eventDate);
        targetDateMidnight.setHours(0, 0, 0, 0);

        if (targetDateMidnight < todayMidnight) {
            return { status: "ERROR", message: "Cannot request a vehicle for a past date." };
        }

        if (targetDateMidnight.getTime() === todayMidnight.getTime()) {
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}`;

            if (startTime <= currentTime) {
                return { status: "ERROR", message: "Cannot request a vehicle for a time that has already passed today." };
            }
        }
        // --------------------------------

        // Fetch the user to check for the priority override
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        const hasPriority = user?.permissions?.has_priority === true;

        // Database Creation Helper
        const createPendingVehicleRequest = async () => {
            await db.vehicleRequest.create({
                data: {
                    userId: userId,
                    vehicleId: vehicleId,
                    date: eventDate,
                    startTime: startTime,
                    endTime: endTime,
                    destination: destination,
                    purpose: purpose,
                    status: "pending" 
                }
            });
        };

        // Priority Override Bypass
        // If they have priority, they can book it even if someone else is pending. 
        // The Admin will sort it out later.
        if (hasPriority) {
            await createPendingVehicleRequest();
            return { status: "SUCCESS" };
        }

        // --- THE PHANTOM BOOKING BLOCKER ---
        // Check if THIS SPECIFIC vehicle is already booked for this time
        const overlappingRequests = await db.vehicleRequest.findMany({
            where: {
                vehicleId: vehicleId,
                date: eventDate,
                status: { in: ["pending", "approved"] }, 
                AND: [
                    { startTime: { lt: endTime } }, 
                    { endTime: { gt: startTime } }  
                ]
            }
        });

        if (overlappingRequests.length > 0) {
            return { 
                status: "ERROR", 
                message: "This vehicle is already requested or booked for this time slot. Please select a different vehicle." 
            };
        }
        // -----------------------------------

        // If it's free, create the request
        await createPendingVehicleRequest();
        return { status: "SUCCESS" };

    } catch (error) {
        console.error("Error creating vehicle request:", error);
        return { status: "ERROR", message: "Internal Server Error" };
    }
};

// --------------------------------------------------------
// THE MAGIC GATEKEEPER
// We wrap our function and demand the "can_request_for_vehicles" permission.
// --------------------------------------------------------
export async function submitVehicleRequest(formData, flags = {}) {
    try {
        // We await the wrapper to get the inner function using the exact DB key
        const secureAction = await withPermissions("can_request_for_vehicles", processVehicleRequest);
        
        // Then we call that inner function with the data
        return await secureAction(formData, flags);
    } catch (error) {
        console.error("Action Wrapper Error:", error);
        return { status: "ERROR", message: "Failed to process vehicle request." };
    }
}




export const updateVehicleRequest = async (id, payload) => {
    try {
        await db.vehicleRequest.update({
            where: { id: id },
            data: {
                vehicleId: payload.vehicleId,
                date: payload.eventDate,
                startTime: payload.startTime,
                endTime: payload.endTime,
                destination: payload.destination,
                purpose: payload.purpose
            }
        });
        return { status: "SUCCESS" };
    } catch (error) {
        console.error("Failed to update vehicle:", error);
        return { status: "ERROR", message: "Failed to update vehicle request." };
    }
};