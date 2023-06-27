const express = require("express")
require("dotenv").config()
const path = require("path")
const cookieParser = require("cookie-parser")
const logger = require("morgan")
const cors = require("cors")
const indexRouter = require("./routes/index")

const app = express()

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))
app.use(cors())

app.use("/api", indexRouter)

const mongoose = require("mongoose")
const { sendResponse } = require("./helpers/utils")
const mongoURI = process.env.MONGODB_URI

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("DB connected")
  })
  .catch((err) => {
    console.log(err)
  })

//Error handling
app.use((req, res, next) => {
  const err = new Error("Not Found")
  err.statusCode = 404
  next(err)
})

app.use((err, req, res, next) => {
  if (err.isOperational) {
    return sendResponse(
      res,
      err.statusCode ? err.statusCode : 500,
      false,
      null,
      { message: err.message },
      err.errorType
    )
  } else {
    return sendResponse(
      res,
      err.statusCode ? err.statusCode : 500,
      false,
      null,
      { message: err.message },
      "Internal Server Error"
    )
  }
})
module.exports = app
