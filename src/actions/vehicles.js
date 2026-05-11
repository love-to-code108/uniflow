"use server"

import { db } from "@/lib/db";
import { withPermissions, withAuthOnly } from "@/actions/gatekeeper";

export async function getAllVehicles() {
    try {
        const vehicles = await db.vehicle.findMany({
            orderBy: { name: 'asc' }
        });
        return { status: "SUCCESS", data: vehicles };
    } catch (error) {
        console.error("Failed to fetch vehicles:", error);
        return { status: "ERROR", message: "Failed to load vehicles." };
    }
}

// --- CREATE NEW VEHICLE (ADMIN ONLY) ---
const processCreateVehicle = async (userId, vehicleData) => {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        if (user?.permissions?.can_manage_system !== true) {
            return { status: "ERROR", message: "Unauthorized: System management privileges required." };
        }

        const existingVehicle = await db.vehicle.findUnique({
            where: { name: vehicleData.name }
        });

        if (existingVehicle) {
            return { status: "ERROR", message: "A vehicle with this name already exists." };
        }

        await db.vehicle.create({
            data: { name: vehicleData.name }
        });

        return { status: "SUCCESS", message: `Vehicle '${vehicleData.name}' added successfully!` };
    } catch (error) {
        console.error("Error creating vehicle:", error);
        return { status: "ERROR", message: "Failed to add the new vehicle." };
    }
};

export async function createNewVehicle(vehicleData) {
    try {
        const secureAction = await withAuthOnly(processCreateVehicle);
        return await secureAction(vehicleData);
    } catch (error) {
        return { status: "ERROR", message: "Failed to process creation request." };
    }
}

// --- SECURE VEHICLE REQUEST & CONFLICT CHECKER ---
const processVehicleRequest = async (userId, formData) => {
    try {
        const { vehicleId, eventDate, startTime, endTime, destination, purpose } = formData;

        // 1. Time Machine Blocker
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
                return { status: "ERROR", message: "Cannot request a vehicle for a past time today." };
            }
        }

        // 2. Fetch User Permissions & Priority
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });
        const hasPriority = user?.permissions?.has_priority === true;

        // 3. Conflict Checker (Mathematically stops double-booking!)
        const startOfDay = new Date(eventDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(eventDate);
        endOfDay.setHours(23, 59, 59, 999);

        const overlappingRequests = await db.vehicleRequest.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
                vehicleId: vehicleId,
                status: { in: ["pending", "approved"] },
                AND: [
                    { startTime: { lt: endTime } },
                    { endTime: { gt: startTime } }
                ]
            }
        });

        if (overlappingRequests.length > 0 && !hasPriority) {
            return { status: "ERROR", message: "This vehicle is already booked for this time slot. Please select another time or vehicle." };
        }

        // 4. Create the Request
        await db.vehicleRequest.create({
            data: {
                destination,
                purpose,
                date: eventDate,
                startTime,
                endTime,
                vehicleId,
                userId,
                status: "pending"
            }
        });

        return { status: "SUCCESS", message: "Vehicle request submitted successfully!" };

    } catch (error) {
        console.error("Error creating vehicle request:", error);
        return { status: "ERROR", message: "Internal Server Error" };
    }
};

export async function submitVehicleRequest(formData) {
    try {
        const secureAction = await withPermissions("can_request_for_vehicles", processVehicleRequest);
        return await secureAction(formData);
    } catch (error) {
        console.error("Action Wrapper Error:", error);
        return { status: "ERROR", message: "Failed to process request." };
    }
}

// --- UPDATE VEHICLE REQUEST ---
export const updateVehicleRequest = async (id, payload) => {
    try {
        await db.vehicleRequest.update({
            where: { id: id },
            data: {
                vehicleId: payload.vehicleId, // Ensure DB relation updates
                destination: payload.destination,
                purpose: payload.purpose,
                date: payload.eventDate,
                startTime: payload.startTime,
                endTime: payload.endTime,
            }
        });
        return { status: "SUCCESS" };
    } catch (error) {
        console.error("Failed to update vehicle request:", error);
        return { status: "ERROR", message: "Failed to update vehicle request." };
    }
};