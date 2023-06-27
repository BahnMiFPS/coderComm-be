const { catchAsync, sendResponse, AppError } = require("../helpers/utils")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const Friend = require("../models/Friend")
const userController = {}

userController.register = catchAsync(async (req, res, next) => {
  // Get data from req
  let { name, email, password } = req.body

  // Business Logic Validation
  let user = await User.findOne({ email })

  if (user) {
    throw new AppError(400, "User Already Existed", `Registration Error`)
  }
  // Process
  const salt = await bcrypt.genSalt(10)
  password = await bcrypt.hash(password, salt)
  user = await User.create({ name, email, password })
  const accessToken = await user.generateToken()
  // Response
  sendResponse(
    res,
    200,
    true,
    { user, accessToken },
    null,
    "Register Successful"
  )
})

userController.getCurrentUser = catchAsync(async (req, res, next) => {
  // Get data from req
  const currentUserId = req.userId

  // Business Logic Validation

  const user = await User.findById(currentUserId)
  // Process
  if (!user) {
    throw new AppError(400, "User Not Found", "User Error")
  }
  // Response
  return sendResponse(
    res,
    200,
    true,
    { user },
    null,
    "Get Current User Successful"
  )
})

userController.getUsers = catchAsync(async (req, res, next) => {
  // Get pagination from query
  let { page, limit, ...filter } = req.query
  page = parseInt(page) || 1
  limit = parseInt(limit) || 10
  const currentUserId = req.userId
  const filterConditions = [{ isDeleted: false }]
  if (filter.name) {
    filterConditions.push({ name: { $regex: filter.name, $options: "i" } })
  }
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {}
  // Business Logic Validation
  const count = await User.countDocuments(filterCriteria)
  const totalPages = Math.ceil(count / limit)
  const offset = limit * (page - 1)
  let users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
  const promises = users.map(async (user) => {
    let temp = user.toJSON()
    temp.friendship = await Friend.findOne({
      $or: [
        { from: currentUserId, to: user._id },
        { from: user._id, to: currentUserId },
      ],
    })
    return temp
  })
  const usersWithFriendships = await Promise.all(promises)
  // Process

  // Response
  sendResponse(
    res,
    200,
    true,
    { users: usersWithFriendships, totalPages, count },
    null,
    "Get Users Successful"
  )
})

userController.getUserById = catchAsync(async (req, res, next) => {
  // Get data from req
  const currentUserId = req.userId
  const { id } = req.params
  // Business Logic Validation
  let user = await User.findById(id)
  // Process
  if (!user) {
    throw new AppError(400, "User Not Found", "User Error")
  }
  user = user.toJSON()

  user.friendship = await Friend.findOne({
    $or: [
      { from: currentUserId, to: user._id },
      { from: user._id, to: currentUserId },
    ],
  })
  // Response
  sendResponse(res, 200, true, user, null, "Get Current User Successful")
})

userController.updateUser = catchAsync(async (req, res, next) => {
  // Put data
  const currentUserId = req.userId
  const { id } = req.params
  // Business Logic Validation
  // Process
  if (currentUserId !== id)
    throw new AppError(400, "Permission Required", "Update User Error")

  let user = await User.findById(id)
  if (!user) {
    throw new AppError(400, "User Not Found", "Update User Error")
  }
  // Process
  const allows = [
    "name",
    "avatarUrl",
    "coverUrl",
    "aboutMe",
    "city",
    "country",
    "company",
    "jobTitle",
    "facebookLink",
    "instagramLink",
    "linkedinLink",
    "twitterLink",
  ]
  allows.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field]
  })
  await user.save()
  // Response
  sendResponse(res, 200, true, user, null, "Get Current User Successful")
})

module.exports = userController
