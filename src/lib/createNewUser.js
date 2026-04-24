"user server"

import { db } from "./db"

export const createNewUser = async({newUserData}) => {

    try{
        const newUser = await db.user.create({newUserData})
    }
    catch(err){
        console.log(err)
    }

}

