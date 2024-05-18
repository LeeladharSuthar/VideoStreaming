import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

// CORS_ORIGIN should be address of frontend where it is hosted
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//  for parsing JSON data sent in the req.body 
//  i.e,. converting a JSON (JavaScript Object Notation) string into a JavaScript object
app.use(express.json({ limit: "16kb" }))

// parse incoming request bodies that are formatted in URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// for serving Static files
app.use(express.static("public"))

// for handling browser's cookies
app.use(cookieParser())


// Routes import

import userRouter from "./routes/user.routes.js"


// Routes declarations
app.use("/api/v1/users", userRouter)


export { app }