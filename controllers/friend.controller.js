const { sendResponse, AppError, catchAsync } = require("../helpers/utils")
const Friend = require("../models/Friend")
const User = require("../models/User")

const friendController = {}
const calculateFriendCount = async (userId) => {
  const friendCount = await Friend.countDocuments({
    $or: [{ from: userId }, { to: userId }],
    status: "accepted",
  })
  await User.findByIdAndUpdate(userId, { friendCount })
}

friendController.sendFriendRequest = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId
  const targetUserId = req.body.to

  // validate
  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    throw new AppError(
      400,
      "Target User Not Found",
      "Send Friend Request Error"
    )
  }
  let request
  // bussiness logic
  request = await Friend.findOne({
    $or: [
      { from: currentUserId, to: targetUserId },
      { from: targetUserId, to: currentUserId },
    ],
  })

  if (request) {
    switch (request.status) {
      case "pending":
        if (request.from.equals(currentUserId)) {
          throw new AppError(
            400,
            "You already sent a friend request to this person",
            "Send Friend Request Error"
          )
        } else {
          throw new AppError(
            400,
            "You already have a friend request from this person",
            "Send Friend Request Error"
          )
        }
      case "accepted":
        throw new AppError(
          400,
          "You already have a relationship this person",
          "Send Friend Request Error"
        )
      case "declined":
        request.from = currentUserId
        request.to = targetUserId
        request.status = "pending"
        await request.save()
        return sendResponse(
          res,
          200,
          true,
          request,
          null,
          "Send Friend Request Successfully"
        )
      default:
        throw new AppError(
          400,
          "Friend Status Undefined",
          "Send Friend Request Error"
        )
    }
  } else {
    request = await Friend.create({
      from: currentUserId,
      to: targetUserId,
      status: "pending",
    })
  }

  return sendResponse(
    res,
    200,
    true,
    request,
    null,
    "Send Friend Request Successfully"
  )
})

friendController.getIncomingRequests = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId
  let { page, limit, ...filter } = req.query

  page = parseInt(page) || 1
  limit = parseInt(limit) || 10

  const incomingRequests = await Friend.find({
    to: currentUserId,
    status: "pending",
  })

  const requestersIds = incomingRequests.map((request) => {
    return request.from
  })
  const filterConditions = [{ _id: { $in: requestersIds } }]
  if (filter.name) {
    filterConditions.push({
      ["name"]: { $regex: filter.name, $options: "i" },
    })
  }

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {}

  const count = await User.countDocuments(filterCriteria)
  const totalPages = Math.ceil(count / limit)
  const offset = limit * (page - 1)

  const users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)

  const usersWithFriendships = users.map((user) => {
    let temp = user.toJSON()
    temp.friendship = incomingRequests.find((friendship) => {
      if (friendship.from.equals(user._id) || friendship.to.equals(user._id)) {
        return { status: friendship.status }
      }
      return false
    })
    return temp
  })

  return sendResponse(
    res,
    200,
    true,
    { users: usersWithFriendships, totalPages, count },
    null,
    "Get Incoming Friend Requests Successful"
  )
})

friendController.getOutgoingRequests = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId
  let { page, limit, ...filter } = req.query

  page = parseInt(page) || 1
  limit = parseInt(limit) || 10

  const outgoingRequests = await Friend.find({
    from: currentUserId,
    status: "pending",
  })

  const requestersIds = outgoingRequests.map((request) => {
    return request.to
  })
  const filterConditions = [{ _id: { $in: requestersIds } }]
  if (filter.name) {
    filterConditions.push({
      ["name"]: { $regex: filter.name, $options: "i" },
    })
  }

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {}

  const count = await User.countDocuments(filterCriteria)
  const totalPages = Math.ceil(count / limit)
  const offset = limit * (page - 1)

  const users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)

  const usersWithFriendships = users.map((user) => {
    let temp = user.toJSON()
    temp.friendship = outgoingRequests.find((friendship) => {
      if (friendship.from.equals(user._id) || friendship.to.equals(user._id)) {
        return { status: friendship.status }
      }
      return false
    })
    return temp
  })

  return sendResponse(
    res,
    200,
    true,
    { users: usersWithFriendships, totalPages, count },
    null,
    "Get Outgoing Friend Requests Successful"
  )
})

friendController.getFriendlists = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId
  let { page, limit, ...filter } = req.query

  page = parseInt(page) || 1
  limit = parseInt(limit) || 10

  const friendList = await Friend.find({
    $or: [{ to: currentUserId }, { from: currentUserId }],
    status: "accepted",
  })

  const friendsIds = friendList.map((request) => {
    request = request.toJSON()
    if (request.from.equals(currentUserId)) {
      return request.to
    } else {
      return request.from
    }
  })
  const filterConditions = [{ _id: { $in: friendsIds } }]

  if (filter.name) {
    filterConditions.push({
      ["name"]: { $regex: filter.name, $options: "i" },
    })
  }

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {}

  const count = await User.countDocuments(filterCriteria)
  const totalPages = Math.ceil(count / limit)
  const offset = limit * (page - 1)

  const users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)

  const usersWithFriendships = users.map((user) => {
    let temp = user.toJSON()
    temp.friendship = friendList.map((friendship) => {
      if (friendship.from.equals(user._id) || friendship.to.equals(user._id)) {
        return { status: friendship.status }
      }
    })
    return temp
  })

  return sendResponse(
    res,
    200,
    true,
    { users: usersWithFriendships, totalPages, count },
    null,
    "Get Friendlist Successful"
  )
})

friendController.reactFriendRequest = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId
  const targetUserId = req.params.id
  console.log(targetUserId)
  const requestReaction = req.body.status
  // validate
  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    throw new AppError(
      400,
      "Target User Not Found",
      "Send Friend Request Error"
    )
  }
  let request
  // bussiness logic
  request = await Friend.findOne({
    from: targetUserId,
    to: currentUserId,
    status: "pending",
  })

  if (request) {
    request.status = requestReaction
    await calculateFriendCount(currentUserId)
    await calculateFriendCount(targetUserId)

    request.save({ new: true })
  } else {
    throw new AppError(
      400,
      "No Friend Request found",
      "Friend Request React Error"
    )
  }

  return sendResponse(
    res,
    200,
    true,
    request,
    null,
    "Reacted Friend Request Successfully"
  )
})

friendController.cancelFriendRequest = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId
  const targetUserId = req.params.id
  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    throw new AppError(
      400,
      "Target User Not Found",
      "Send Friend Request Error"
    )
  }

  let request
  request = await Friend.findOne({
    from: currentUserId,
    to: targetUserId,
    status: "pending",
  })
  if (!request) {
    throw new AppError(
      400,
      "Friend Request Not Found",
      "Cancel Friend Request Error"
    )
  } else {
    await request.deleteOne()
    sendResponse(res, 200, true, request, null, "Request Deleted Successful")
  }
  // validate
})

friendController.removeFriend = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId
  const targetUserId = req.params.id

  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    throw new AppError(
      400,
      "Target User Not Found",
      "Send Friend Request Error"
    )
  }

  let request = await Friend.findOne({
    $or: [
      { from: currentUserId, to: targetUserId },
      { from: targetUserId, to: currentUserId },
    ],
    status: "accepted",
  })
  if (!request) {
    throw new AppError(
      400,
      "No Friend Request found",
      "Remove Friend Request Error"
    )
  } else {
    request.deleteOne()
    await calculateFriendCount(currentUserId)
    await calculateFriendCount(targetUserId)
    return sendResponse(
      res,
      200,
      true,
      request,
      null,
      "Friend Removed Successfully"
    )
  }
})
module.exports = friendController
