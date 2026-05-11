"use server"

import { db } from "@/lib/db";
import { withPermissions } from "@/actions/gatekeeper";

const processEventRequest = async (userId, formData, flags = {}) => {
    try {
        const {
            eventName,
            eventDescription,
            eventDate,
            startTime,
            endTime,
            expectedStudents,
            registrationLink
        } = formData;

        // --- TIME MACHINE BLOCKER ---
        const now = new Date();
        const todayMidnight = new Date(now);
        todayMidnight.setHours(0, 0, 0, 0);

        const targetDateMidnight = new Date(eventDate);
        targetDateMidnight.setHours(0, 0, 0, 0);

        if (targetDateMidnight < todayMidnight) {
            return { status: "ERROR", message: "Cannot schedule an event in the past." };
        }

        if (targetDateMidnight.getTime() === todayMidnight.getTime()) {
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}`;

            if (startTime <= currentTime) {
                return { status: "ERROR", message: "Cannot schedule an event for a time that has already passed today." };
            }
        }

        // --- USER PERMISSIONS ---
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        const hasPriority = user?.permissions?.has_priority === true;
        const isAdmin = user?.permissions?.can_approve_events === true;

        // --- FULLY DYNAMIC VENUE ASSIGNMENT ---
        // 1. Fetch all venues sorted by capacity (Smallest to Largest)
        const allVenues = await db.venue.findMany({
            orderBy: { capacity: 'asc' }
        });

        if (allVenues.length === 0) {
            return { status: "ERROR", message: "No venues found in the database. Please add venues via the Admin panel." };
        }

        // Separate the special "Others" fallback from the standard rooms
        const others = allVenues.find(v => v.name.toLowerCase() === "others");
        const standardVenues = allVenues.filter(v => v.name.toLowerCase() !== "others");

        // 2. Mathematical Best Fit Logic
        // Find the smallest room that can fit the expected students
        let targetVenue = null;
        for (const venue of standardVenues) {
            if (expectedStudents <= venue.capacity) {
                targetVenue = venue;
                break; // Stop at the first room that fits!
            }
        }

        // 3. Strict Capacity Check
        if (!targetVenue) {
            // If targetVenue is still null, expectedStudents is larger than our biggest standard room
            const maxCapacity = standardVenues.length > 0 ? standardVenues[standardVenues.length - 1].capacity : 0;

            if (!isAdmin) {
                return {
                    status: "ERROR",
                    message: `Capacity exceeds maximum allowed (${maxCapacity}). Only admins can book for larger events.`
                };
            }
            
            if (!others) {
                 return { status: "ERROR", message: "Admin override failed: 'Others' venue is missing from the database." };
            }
            targetVenue = others;
        }

        // Override if they accepted an alternative in the fallback loop
        if (flags.acceptedVenueId) {
            targetVenue = allVenues.find(v => v.id === flags.acceptedVenueId);
        }

        // --- DB CREATION HELPER ---
        const createPendingEvent = async (venueToBook) => {
            await db.event.create({
                data: {
                    name: eventName,
                    description: eventDescription || "",
                    date: eventDate,
                    startTime: startTime,
                    endTime: endTime,
                    expectedNumberOfStudents: expectedStudents,
                    venueId: venueToBook.id, 
                    registrationLink: registrationLink || null,
                    status: "pending",
                    userId: userId
                }
            });
        };

        // Priority Bypass
        if (hasPriority && targetVenue.name.toLowerCase() !== "others") {
            await createPendingEvent(targetVenue);
            return { status: "SUCCESS", venue: targetVenue.name };
        }

        // Conflict Checker Upgrade
        const checkAvailability = async (venueToCheck) => {
            if (venueToCheck.name.toLowerCase() === "others") return true; 
            
            // THE FIX: Create a window for the entire day to catch ALL timezone drifts
            const startOfDay = new Date(eventDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(eventDate);
            endOfDay.setHours(23, 59, 59, 999);

            const overlappingEvents = await db.event.findMany({
                where: {
                    date: { gte: startOfDay, lte: endOfDay }, // Safely checks the whole day
                    venueId: venueToCheck.id, 
                    status: { in: ["pending", "approved"] },
                    AND: [
                        { startTime: { lt: endTime } },
                        { endTime: { gt: startTime } }
                    ]
                }
            });
            return overlappingEvents.length === 0;
        };

        const isTargetFree = await checkAvailability(targetVenue);

        if (isTargetFree) {
            await createPendingEvent(targetVenue);
            return { status: "SUCCESS", venue: targetVenue.name };
        }

        // --- DYNAMIC FALLBACK LOOP ---
        // If the target is full, automatically check all rooms LARGER than the target
        if (!flags.acceptedVenueId && targetVenue.name.toLowerCase() !== "others") {
            const targetIndex = standardVenues.findIndex(v => v.id === targetVenue.id);
            const fallbacks = standardVenues.slice(targetIndex + 1); // Slice gives us everything larger

            for (const fallbackVenue of fallbacks) {
                const isFallbackFree = await checkAvailability(fallbackVenue);
                if (isFallbackFree) {
                    return {
                        status: "ALTERNATIVE_AVAILABLE",
                        suggestedVenue: fallbackVenue.name,
                        suggestedVenueId: fallbackVenue.id,
                    };
                }
            }
        }

        return {
            status: "NO_VENUES",
            message: "All suitable seminar halls are completely booked for this time slot."
        };

    } catch (error) {
        console.error("Error creating event request:", error);
        return { status: "ERROR", message: "Internal Server Error" };
    }
};

export async function submitEventRequest(formData, flags = {}) {
    try {
        const secureAction = await withPermissions("can_request_event", processEventRequest);
        return await secureAction(formData, flags);
    } catch (error) {
        console.error("Action Wrapper Error:", error);
        return { status: "ERROR", message: "Failed to process request." };
    }
}

export const updateEventRequest = async (id, payload) => {
    try {
        await db.event.update({
            where: { id: id },
            data: {
                name: payload.eventName,
                description: payload.eventDescription,
                date: payload.eventDate,
                startTime: payload.startTime,
                endTime: payload.endTime,
                expectedNumberOfStudents: parseInt(payload.expectedStudents), 
                registrationLink: payload.registrationLink,
                venueId: payload.venueId 
            }
        });
        return { status: "SUCCESS" };
    } catch (error) {
        console.error("Failed to update event:", error);
        return { status: "ERROR", message: "Failed to update event." };
    }
};