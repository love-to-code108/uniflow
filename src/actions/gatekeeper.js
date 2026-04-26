"use server";

import { db } from "@/lib/db";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const encodedKey = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Higher-Order Function to protect Server Actions
 * @param {string} requiredPermission - The JSON key from your database (e.g., "can_request_event")
 * @param {Function} action - The actual server action to run if approved
 */
export async function withPermissions(requiredPermission, action) {
    return async (...args) => {
        try {
            // 1. Grab the secure cookie (Notice the await!)
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get("session")?.value;
            
            if (!sessionCookie) {
                return { status: "ERROR", message: "Unauthorized: Please log in." };
            }

            // 2. Verify and crack open the JWT to get the exact userId
            const { payload } = await jwtVerify(sessionCookie, encodedKey);
            const userId = payload.userId;

            // 3. Fetch the absolute source of truth from the DB
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { permissions: true }
            });

            if (!user) {
                return { status: "ERROR", message: "Unauthorized: User not found." };
            }

            // 4. Check the specific permission (Defaults to false if undefined)
            const hasPermission = user.permissions?.[requiredPermission] === true;

            if (!hasPermission) {
                return { status: "ERROR", message: `Forbidden: You do not have permission to ${requiredPermission}.` };
            }

            // 5. THE HANDOFF
            // If they pass, execute the main function! 
            // We pass the userId in as the first argument so your target function always knows who called it.
            return await action(userId, ...args);

        } catch (error) {
            console.error("Gatekeeper Error:", error);
            return { status: "ERROR", message: "Unauthorized: Invalid or expired session." };
        }
    };
}