"use server"

import { db } from "@/lib/db";
import { withPermissions } from "@/actions/gatekeeper"; // Make sure this path matches where you saved gatekeeper.js

// 1. The Core Logic
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

        // --- FIX 1: THE TIME MACHINE BLOCKER (Upgraded for Same-Day) ---
        const now = new Date();

        // Strip the time to compare just the pure dates
        const todayMidnight = new Date(now);
        todayMidnight.setHours(0, 0, 0, 0);

        const targetDateMidnight = new Date(eventDate);
        targetDateMidnight.setHours(0, 0, 0, 0);

        // Check 1: Is the calendar day entirely in the past?
        if (targetDateMidnight < todayMidnight) {
            return {
                status: "ERROR",
                message: "Cannot schedule an event in the past."
            };
        }

        // Check 2: If the event is TODAY, is the start time already passed?
        if (targetDateMidnight.getTime() === todayMidnight.getTime()) {
            // Get current time in "HH:MM" 24-hour format (e.g., "23:29")
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}`;

            // Compare the strings directly (e.g., "10:00" <= "23:29")
            if (startTime <= currentTime) {
                return {
                    status: "ERROR",
                    message: "Cannot schedule an event for a time that has already passed today."
                };
            }
        }
        // --------------------------------------------------------------

        // Fetch the user to check for the priority override
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        const hasPriority = user?.permissions?.has_priority === true;

        // Determine the Ideal Venue based on capacity
        let targetVenue = "Auditorium 1";
        if (expectedStudents > 200 && expectedStudents <= 300) targetVenue = "Auditorium 3";
        if (expectedStudents > 100 && expectedStudents <= 200) targetVenue = "Auditorium 2";

        // Handle 300+ Capacity Edge Case
        if (expectedStudents > 300) {
            targetVenue = "Auditorium 3";

            if (!hasPriority && !flags.forceCapacity) {
                return {
                    status: "CAPACITY_WARNING",
                    message: "The college cannot comfortably accommodate over 300 students. Proceed anyway?"
                };
            }
        }

        if (flags.acceptedVenue) {
            targetVenue = flags.acceptedVenue;
        }

        // Database Creation Helper
        const createPendingEvent = async (venueToBook) => {
            await db.event.create({
                data: {
                    name: eventName,
                    description: eventDescription || "",
                    date: eventDate,
                    startTime: startTime,
                    endTime: endTime,
                    expectedNumberOfStudents: expectedStudents,
                    venue: venueToBook,
                    registrationLink: registrationLink || null,
                    status: "pending",
                    userId: userId
                }
            });
        };

        // Priority Override Bypass
        if (hasPriority) {
            await createPendingEvent(targetVenue);
            return { status: "SUCCESS", venue: targetVenue };
        }

        // --- FIX 2: THE PHANTOM BOOKING BLOCKER ---
        const checkAvailability = async (venueToCheck) => {
            const overlappingEvents = await db.event.findMany({
                where: {
                    date: eventDate,
                    venue: venueToCheck,
                    // Now blocks if the slot is taken by either an approved OR a pending event
                    status: { in: ["pending", "approved"] },
                    AND: [
                        { startTime: { lt: endTime } },
                        { endTime: { gt: startTime } }
                    ]
                }
            });
            return overlappingEvents.length === 0;
        };
        // ------------------------------------------

        // Check the Target Venue
        const isTargetFree = await checkAvailability(targetVenue);

        if (isTargetFree) {
            await createPendingEvent(targetVenue);
            return { status: "SUCCESS", venue: targetVenue };
        }

        // The Fallback Loop 
        if (!flags.acceptedVenue) {
            const fallbacks = [];
            if (targetVenue === "Auditorium 1") fallbacks.push("Auditorium 2", "Auditorium 3");
            if (targetVenue === "Auditorium 2") fallbacks.push("Auditorium 3");

            for (const fallbackVenue of fallbacks) {
                const isFallbackFree = await checkAvailability(fallbackVenue);
                if (isFallbackFree) {
                    return {
                        status: "ALTERNATIVE_AVAILABLE",
                        suggestedVenue: fallbackVenue
                    };
                }
            }
        }

        // Ultimate Failure State
        return {
            status: "NO_VENUES",
            message: "All auditoriums are booked for this time slot."
        };

    } catch (error) {
        console.error("Error creating event request:", error);
        return { status: "ERROR", message: "Internal Server Error" };
    }
};

// --------------------------------------------------------
// THE MAGIC GATEKEEPER
// We wrap our function and demand the "can_request_event" permission.
// This is what gets exported and called by your frontend.
// --------------------------------------------------------
// --------------------------------------------------------
// THE MAGIC GATEKEEPER (Next.js Strict Mode Fix)
// --------------------------------------------------------
export async function submitEventRequest(formData, flags = {}) {
    try {
        // We await the wrapper to get the inner function
        const secureAction = await withPermissions("can_request_event", processEventRequest);

        // Then we call that inner function with the data
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
                expectedStudents: parseInt(payload.expectedStudents),
                registrationLink: payload.registrationLink
            }
        });
        return { status: "SUCCESS" };
    } catch (error) {
        console.error("Failed to update event:", error);
        return { status: "ERROR", message: "Failed to update event." };
    }
};