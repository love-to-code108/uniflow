"use server"

import { db } from "./db"

export const createNewUser = async (user) => {

    // console.log(newUserData);

    try {


        // first check if the username already exists or not
        const checkUser = await db.user.findUnique({
            where:{
                username:user.UserName
            }
        })


        if(checkUser){
            return({
                type:"error",
                message:"user already exists"
            })
        }




        // create new user
        const newUser = await db.user.create({
            data: {
                username: user.UserName,
                password: user.Password,
                permissions: {
                    "can_view":true,
                    "can_request_event": user.can_request_event,
                    "can_request_for_vehicles": user.can_request_for_vehicles,
                    "can_request_guest_room": user.can_request_guest_room,
                    "can_approve_events": user.can_approve_events,
                    "can_approve_guests": user.can_approve_guests,
                    "can_approve_vehicles": user.can_approve_vehicles,
                }
            }
        })
    }
    catch (err) {
        console.log(err)
        return({
            type:"error",
            message:err
        })
    }

    

    // if everything ran smoothly
    return({
        type:"success",
        message:"User created sucessfully"
    })

}

