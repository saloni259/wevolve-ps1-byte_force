import dotenv from "dotenv"
dotenv.config({path: './.env'})


import mongoose from "mongoose"
import { DB_NAME } from "../constant.js"



const conectDB = async () => {
    try {
        const take = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log(`\nMONGOODB IS CONNECTED !!!!! ${take.connection.host}`)
    } catch (error) {
        console.log('MONGOODB CONNECTION ERROR.....',error)
        process.exit(1);
    }
}
export default conectDB