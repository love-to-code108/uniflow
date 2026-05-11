"use server";

import { db } from "@/lib/db";
import { withAuthOnly } from "@/actions/gatekeeper";

const fetchTableData = async (userId) => {
    try {
        // 1. STRICT GATEKEEPER CHECK: Fetch the user's exact permissions
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });

        if (!user) return { status: "ERROR", message: "User not found." };

        const perms = user.permissions || {};
        const canSeeEvents = perms.can_approve_events === true;
        const canSeeVehicles = perms.can_approve_vehicles === true;
        const canSeeGuests = perms.can_approve_guests === true;

        // If they have NONE of these, they are trespassing. Kick them out.
        if (!canSeeEvents && !canSeeVehicles && !canSeeGuests) {
            return { status: "ERROR", message: "Unauthorized access to Action Center." };
        }

        // 2. DYNAMIC FETCHING: Only ask the database for what they are allowed to manage!
        const queries = [];

        if (canSeeEvents) {
            queries.push(
                db.event.findMany({
                    orderBy: { date: 'asc' },
                    include: { user: { select: { name: true, username: true } } }
                }).then(res => res.map(e => ({ ...e, type: "event", title: e.name, sortDate: e.date })))
            );
        }

        if (canSeeVehicles) {
            queries.push(
                db.vehicleRequest.findMany({
                    orderBy: { date: 'asc' },
                    include: { user: { select: { name: true, username: true } }, vehicle: true }
                }).then(res => res.map(v => ({ ...v, type: "vehicle", title: v.vehicle?.name || "Vehicle Request", sortDate: v.date })))
            );
        }

        if (canSeeGuests) {
            queries.push(
                db.guestRoomRequest.findMany({
                    orderBy: { checkInDate: 'asc' },
                    include: { user: { select: { name: true, username: true } }, room: true }
                }).then(res => res.map(g => ({ ...g, type: "guest", title: g.room?.name || "Room Request", sortDate: g.checkInDate })))
            );
        }

        // Run all allowed queries in parallel for maximum speed
        const results = await Promise.all(queries);

        // Flatten the arrays into a single list and sort by date (Oldest/most urgent first)
        const flattened = results.flat().sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));

        return { status: "SUCCESS", data: flattened };
    } catch (error) {
        console.error("Action Center Error:", error);
        return { status: "ERROR", message: "Failed to fetch table data." };
    }
};

export async function getActionCenterData() {
    // withAuthOnly automatically checks the JWT and safely passes the userId to fetchTableData
    const secureAction = await withAuthOnly(fetchTableData);
    return await secureAction();
}