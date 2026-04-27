"use server";

import { db } from "@/lib/db";
import { withAuthOnly } from "@/actions/gatekeeper";

const fetchTableData = async (userId) => {
    try {
        const [events, vehicles, guests] = await Promise.all([
            db.event.findMany({
                orderBy: { date: 'asc' },
                include: { user: { select: { name: true, username: true } } }
            }),
            db.vehicleRequest.findMany({
                orderBy: { date: 'asc' },
                include: { user: { select: { name: true, username: true } }, vehicle: true }
            }),
            db.guestRoomRequest.findMany({
                orderBy: { checkInDate: 'asc' },
                include: { user: { select: { name: true, username: true } }, room: true }
            })
        ]);

        const flattened = [
            ...events.map(e => ({ ...e, type: "event", title: e.name, sortDate: e.date })),
            ...vehicles.map(v => ({ ...v, type: "vehicle", title: v.vehicle?.name || "Vehicle Request", sortDate: v.date })),
            ...guests.map(g => ({ ...g, type: "guest", title: g.room?.name || "Room Request", sortDate: g.checkInDate }))
        ].sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));

        return { status: "SUCCESS", data: flattened };
    } catch (error) {
        console.error("Action Center Error:", error);
        return { status: "ERROR", message: "Failed to fetch table data." };
    }
};

export async function getActionCenterData() {
    const secureAction = await withAuthOnly(fetchTableData);
    return await secureAction();
}