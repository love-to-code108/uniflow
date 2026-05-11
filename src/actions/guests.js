"use server"

import { db } from "@/lib/db";
import { withPermissions, withAuthOnly } from "@/actions/gatekeeper";

// --- FETCH ALL GUEST ROOMS ---
export async function getAllGuestRooms() {
    try {
        const rooms = await db.guestRoom.findMany({
            orderBy: { name: 'asc' }
        });
        return { status: "SUCCESS", data: rooms };
    } catch (error) {
        console.error("Failed to fetch guest rooms:", error);
        return { status: "ERROR", message: "Failed to load guest rooms." };
    }
}

// --- CREATE NEW GUEST ROOM (ADMIN ONLY) ---
const processCreateGuestRoom = async (userId, roomData) => {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        if (user?.permissions?.can_manage_system !== true) {
            return { status: "ERROR", message: "Unauthorized: System management privileges required." };
        }

        const existingRoom = await db.guestRoom.findUnique({
            where: { name: roomData.name }
        });

        if (existingRoom) {
            return { status: "ERROR", message: "A guest room with this name already exists." };
        }

        await db.guestRoom.create({
            data: { name: roomData.name }
        });

        return { status: "SUCCESS", message: `Guest Room '${roomData.name}' added successfully!` };
    } catch (error) {
        return { status: "ERROR", message: "Failed to add the new guest room." };
    }
};

export async function createNewGuestRoom(roomData) {
    try {
        const secureAction = await withAuthOnly(processCreateGuestRoom);
        return await secureAction(roomData);
    } catch (error) {
        return { status: "ERROR", message: "Failed to process creation request." };
    }
}

// --- SECURE GUEST REQUEST & CONFLICT CHECKER ---
const processGuestRequest = async (userId, formData) => {
    try {
        const { roomId, checkInDate, checkOutDate, guestName, purpose } = formData;

        // 1. Time Machine Blocker
        const now = new Date();
        const todayMidnight = new Date(now);
        todayMidnight.setHours(0, 0, 0, 0);

        const targetCheckIn = new Date(checkInDate);
        targetCheckIn.setHours(0, 0, 0, 0);

        if (targetCheckIn < todayMidnight) {
            return { status: "ERROR", message: "Cannot request a room for a past date." };
        }

        // 2. Fetch User Permissions & Priority
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });
        const hasPriority = user?.permissions?.has_priority === true;

        // 3. Conflict Checker (Mathematically stops double-booking days!)
        const overlappingRequests = await db.guestRoomRequest.findMany({
            where: {
                roomId: roomId,
                status: { in: ["pending", "approved"] },
                AND: [
                    { checkInDate: { lt: checkOutDate } },
                    { checkOutDate: { gt: checkInDate } }
                ]
            }
        });

        if (overlappingRequests.length > 0 && !hasPriority) {
            return { status: "ERROR", message: "This room is already booked during these dates. Please select another room." };
        }

        // 4. Create the Request
        await db.guestRoomRequest.create({
            data: {
                guestName,
                purpose,
                checkInDate,
                checkOutDate,
                roomId,
                userId,
                status: "pending"
            }
        });

        return { status: "SUCCESS", message: "Guest room request submitted successfully!" };

    } catch (error) {
        console.error("Error creating guest request:", error);
        return { status: "ERROR", message: "Internal Server Error" };
    }
};

export async function submitGuestRequest(formData) {
    try {
        const secureAction = await withPermissions("can_request_guest_room", processGuestRequest);
        return await secureAction(formData);
    } catch (error) {
        return { status: "ERROR", message: "Failed to process request." };
    }
}

// --- UPDATE GUEST REQUEST ---
export const updateGuestRequest = async (id, payload) => {
    try {
        await db.guestRoomRequest.update({
            where: { id: id },
            data: {
                roomId: payload.roomId, // Ensure DB relation updates
                guestName: payload.guestName,
                purpose: payload.purpose,
                checkInDate: payload.checkInDate,
                checkOutDate: payload.checkOutDate,
            }
        });
        return { status: "SUCCESS" };
    } catch (error) {
        console.error("Failed to update guest request:", error);
        return { status: "ERROR", message: "Failed to update guest request." };
    }
};