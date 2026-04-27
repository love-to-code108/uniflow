

"use server";

import { db } from "@/lib/db";

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
                select: { id: true, name: true, date: true, startTime: true, status: true }
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