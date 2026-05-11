"use server"

import { db } from "./db"

export const createNewUser = async (user) => {
    try {
        // First check if the username already exists or not
        const checkUser = await db.user.findUnique({
            where: {
                username: user.UserName
            }
        })

        if (checkUser) {
            return {
                type: "error",
                message: "User already exists"
            }
        }

        // Create new user
        const newUser = await db.user.create({
            data: {
                username: user.UserName,
                password: user.Password,
                permissions: {
                    "can_view": true,
                    "can_request_event": user.can_request_event,
                    "can_request_for_vehicles": user.can_request_for_vehicles,
                    "can_request_guest_room": user.can_request_guest_room,
                    "can_approve_events": user.can_approve_events,
                    "can_approve_guests": user.can_approve_guests,
                    "can_approve_vehicles": user.can_approve_vehicles,
                    
                    // --- NEW ADMINISTRATIVE PERMISSIONS ---
                    "has_priority": user.has_priority,
                    "can_create_users": user.can_create_users,
                    "can_manage_system": user.can_manage_system,
                }
            }
        })
    }
    catch (err) {
        console.error(err)
        return {
            type: "error",
            message: "Failed to create user."
        }
    }

    // If everything ran smoothly
    return {
        type: "success",
        message: "User created successfully"
    }
}