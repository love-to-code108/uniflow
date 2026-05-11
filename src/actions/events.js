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

        // --- DYNAMIC VENUE ASSIGNMENT ---
        // 1. Fetch all available venues from the database
        const allVenues = await db.venue.findMany();
        
        const mini = allVenues.find(v => v.name === "Mini seminar hall");
        const firstFloor = allVenues.find(v => v.name === "First floor seminar hall");
        const basement = allVenues.find(v => v.name === "Basement seminar hall");
        const others = allVenues.find(v => v.name === "Others");

        if (!mini || !firstFloor || !basement || !others) {
            return { status: "ERROR", message: "Venues are not properly set up in the database." };
        }

        // 2. Best Fit Logic based on strict capacities
        let targetVenue = mini;
        if (expectedStudents > mini.capacity && expectedStudents <= firstFloor.capacity) targetVenue = firstFloor;
        if (expectedStudents > firstFloor.capacity && expectedStudents <= basement.capacity) targetVenue = basement;

        // 3. The Strict Capacity Check
        if (expectedStudents > basement.capacity) {
            if (!isAdmin) {
                return {
                    status: "ERROR",
                    message: `Capacity exceeds maximum allowed (${basement.capacity}). Only admins can book 'Others' for larger events.`
                };
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
                    venueId: venueToBook.id, // Now using Relation ID!
                    registrationLink: registrationLink || null,
                    status: "pending",
                    userId: userId
                }
            });
        };

        // Priority Bypass
        if (hasPriority && targetVenue.name !== "Others") {
            await createPendingEvent(targetVenue);
            return { status: "SUCCESS", venue: targetVenue.name };
        }

        // Conflict Checker
        const checkAvailability = async (venueToCheck) => {
            if (venueToCheck.name === "Others") return true; 
            
            const overlappingEvents = await db.event.findMany({
                where: {
                    date: eventDate,
                    venueId: venueToCheck.id, // Check by Relation ID
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

        // --- FALLBACK LOOP ---
        if (!flags.acceptedVenueId && targetVenue.name !== "Others") {
            const fallbacks = [];
            if (targetVenue.name === "Mini seminar hall") fallbacks.push(firstFloor, basement);
            if (targetVenue.name === "First floor seminar hall") fallbacks.push(basement);

            for (const fallbackVenue of fallbacks) {
                const isFallbackFree = await checkAvailability(fallbackVenue);
                if (isFallbackFree) {
                    return {
                        status: "ALTERNATIVE_AVAILABLE",
                        suggestedVenue: fallbackVenue.name,
                        suggestedVenueId: fallbackVenue.id, // Pass the ID back to frontend
                    };
                }
            }
        }

        return {
            status: "NO_VENUES",
            message: "All seminar halls are completely booked for this time slot."
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
                venueId: payload.venueId // Now updating Relation ID!
            }
        });
        return { status: "SUCCESS" };
    } catch (error) {
        console.error("Failed to update event:", error);
        return { status: "ERROR", message: "Failed to update event." };
    }
};