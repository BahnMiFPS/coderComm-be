const { AppError, catchAsync, sendResponse } = require("../helpers/utils")
const User = require("../models/User")
const bcrypt = require("bcryptjs")
const authController = {}

authController.register = async (req, res, next) => {
  res.send("Auth Registration")
}

authController.login = catchAsync(async (req, res, next) => {
  // Get data from req
  const { email, password } = req.body
  // Business Logic Validation
  const user = await User.findOne({ email }, "+password")
  if (!user) throw new AppError(400, "Invalid Credentials", "Login Error")

  // Process
  const isMatch = await bcrypt.compare(password, user.password)
  console.log("This user password: ", password, user.password)
  if (!isMatch) throw new AppError(400, "Wrong Password", "Login Error")

  const accessToken = await user.generateToken()

  // Response
  sendResponse(res, 200, true, { user, accessToken }, null, "Login Successful")
})

module.exports = authController
