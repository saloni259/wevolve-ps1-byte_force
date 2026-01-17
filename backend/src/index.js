import dotenv from "dotenv"
dotenv.config({path: './.env'})

import {app} from "./app.js"
import conectDB from "./db/index.js"


conectDB()
.then(() => {
    app.on("error",(error) => {
        console.log("ERROR : error");
        throw error
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB connection failled !!!",err);
})