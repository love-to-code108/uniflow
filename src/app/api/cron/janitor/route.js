import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request) {
    // 1. THE SECURITY CHECK
    // Extract the authorization header from the incoming request
    const authHeader = request.headers.get("authorization");
    
    // Compare it against the secret stored in your .env file
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
            { status: "ERROR", message: "Unauthorized access." },
            { status: 401 }
        );
    }

    try {
        // 2. THE TIME MATH
        // Get exactly midnight of the current day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 3. THE EXECUTION
        // Use Prisma's .deleteMany() with the "lt" (less than) operator to wipe expired requests
        // We run all three in parallel for maximum performance
        const [sweptEvents, sweptVehicles, sweptGuests] = await Promise.all([
            db.event.deleteMany({
                where: { 
                    status: "pending", 
                    date: { lt: today } 
                }
            }),
            db.vehicleRequest.deleteMany({
                where: { 
                    status: "pending", 
                    date: { lt: today } 
                }
            }),
            db.guestRoomRequest.deleteMany({
                where: { 
                    status: "pending", 
                    checkInDate: { lt: today } // If the check-in day passed and it's pending, it's dead
                }
            })
        ]);

        return NextResponse.json({
            status: "SUCCESS",
            message: "Janitor executed successfully.",
            swept: {
                events: sweptEvents.count,
                vehicles: sweptVehicles.count,
                guests: sweptGuests.count
            }
        });

    } catch (error) {
        console.error("Janitor Error:", error);
        return NextResponse.json(
            { status: "ERROR", message: "Failed to execute database sweep." },
            { status: 500 }
        );
    }
}