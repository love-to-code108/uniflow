"use server";

import { db } from "@/lib/db";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const encodedKey = new TextEncoder().encode(process.env.JWT_SECRET);

export async function withPermissions(requiredPermission, action) {
    return async (...args) => {
        try {
            // 1. Properly await the cookie store
            const cookieStore = await cookies();
            const sessionToken = cookieStore.get("session")?.value;
            
            if (!sessionToken) {
                return { status: "ERROR", message: "Unauthorized: Please log in again." };
            }

            // 2. Verify the JWT
            let userId;
            try {
                const { payload } = await jwtVerify(sessionToken, encodedKey);
                userId = payload.userId;
            } catch (jwtError) {
                return { status: "ERROR", message: "Session expired. Please log in again." };
            }

            if (!userId) {
                return { status: "ERROR", message: "Invalid session data." };
            }

            // 3. Check the DB
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { permissions: true }
            });

            if (!user) {
                return { status: "ERROR", message: "User no longer exists." };
            }

            // 4. Permission Check
            const hasPermission = user.permissions?.[requiredPermission] === true;

            if (!hasPermission) {
                return { status: "ERROR", message: `You do not have permission: ${requiredPermission}` };
            }

            // 5. Success! Pass the userId to the actual action
            return await action(userId, ...args);

        } catch (error) {
            console.error("Gatekeeper Critical Error:", error);
            // This prevents the generic "Internal Server Error" from hiding the real cause
            return { status: "ERROR", message: "Security check failed. Try again." };
        }
    };
}





// Add this to the bottom of src/actions/gatekeeper.js

export async function withAuthOnly(action) {
    return async (...args) => {
        try {
            const cookieStore = await cookies();
            const sessionToken = cookieStore.get("session")?.value;
            
            if (!sessionToken) {
                return { status: "ERROR", message: "Unauthorized: Please log in again." };
            }

            let userId;
            try {
                const { payload } = await jwtVerify(sessionToken, encodedKey);
                userId = payload.userId;
            } catch (jwtError) {
                return { status: "ERROR", message: "Session expired. Please log in again." };
            }

            if (!userId) {
                return { status: "ERROR", message: "Invalid session data." };
            }

            // Pass the verified userId straight to the action
            return await action(userId, ...args);

        } catch (error) {
            console.error("Auth Wrapper Error:", error);
            return { status: "ERROR", message: "Authentication failed." };
        }
    };
}