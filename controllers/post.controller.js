const { AppError, sendResponse, catchAsync } = require("../helpers/utils")
const Comment = require("../models/Comment")
const Friend = require("../models/Friend")
const Post = require("../models/Post")
const User = require("../models/User")
const postController = {}

const calculatePostCount = async (userId) => {
  const postCount = await Post.countDocuments({
    author: userId,
    isDeleted: false,
  })
  await User.findByIdAndUpdate(userId, { postCount })
  return
}

postController.createPost = catchAsync(async (req, res, next) => {
  const { content, image } = req.body
  const currentUserId = req.userId
  let post = await Post.create({
    content,
    image,
    author: currentUserId,
  })
  await calculatePostCount(currentUserId)
  post = await post.populate("author")
  sendResponse(res, 200, true, post, null, "Create Post Successful")
})

postController.updatePost = catchAsync(async (req, res, next) => {
  // Put data
  const currentUserId = req.userId
  const { id } = req.params
  // Business Logic Validation
  let post = await Post.findById(id)
  if (!post) {
    throw new AppError(400, "Post Not Found", "Update Post Error")
  }
  if (!post.author.equals(currentUserId)) {
    throw new AppError(400, "Only Author can Edit Post", "Update Post Error")
  }
  // Process
  const allows = ["content", "image"]
  allows.forEach((field) => {
    if (req.body[field] !== undefined) post[field] = req.body[field]
  })
  await post.save()
  // Response
  sendResponse(res, 200, true, post, null, "Update Post Successful")
})
postController.deleteSinglePost = catchAsync(async (req, res, next) => {
  // Put data
  const currentUserId = req.userId
  const { id } = req.params
  // Business Logic Validation
  let post = await Post.findByIdAndUpdate(
    {
      _id: id,
      author: currentUserId,
    },
    {
      isDeleted: true,
    },
    { new: true }
  )
  await calculatePostCount(currentUserId)
  // Process

  // Response
  sendResponse(res, 200, true, post, null, "Delete Post Successful")
})
postController.getPostById = catchAsync(async (req, res, next) => {
  // Get data from req
  const currentPostId = req.postId
  const { id } = req.params
  // Business Logic Validation
  let post = await Post.findById(id)
  // Process
  if (!post) {
    throw new AppError(400, "Post Not Found", "Post Error")
  }

  post = post.toJSON()
  post.comment = await Comment.find({ id: post._id }).populate("post", "author")

  // Response
  sendResponse(res, 200, true, post, null, "Get Post By Id Successful")
})

postController.getPostFromUserId = catchAsync(async (req, res, next) => {
  // Get pagination from query
  const { userId } = req.params
  let { page, limit } = req.query
  page = parseInt(page) || 1
  limit = parseInt(limit) || 10
  let user = await User.findById(userId)
  if (!user) {
    throw new AppError(400, "Can not find user", "Get Post Error")
  }
  const currentUserId = req.userId

  // Process

  let userFriendsIds = await Friend.find({
    $or: [{ from: userId }, { to: userId }],
    status: "accepted",
  })
  if (userFriendsIds && userFriendsIds.length) {
    userFriendsIds = userFriendsIds.map((friend) => {
      if (friend.from._id.equals(userId)) {
        return friend.to
      }
      return friend.from
    })
  } else {
    userFriendsIds = []
  }
  userFriendsIds = [...userFriendsIds, userId]

  const filterConditions = [
    { isDeleted: false },
    { author: { $in: userFriendsIds } },
  ]
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {}
  // Business Logic Validation
  const count = await Post.countDocuments(filterCriteria)
  const totalPages = Math.ceil(count / limit)
  const offset = limit * (page - 1)

  let posts = await Post.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("author")

  // Response
  return sendResponse(
    res,
    200,
    true,
    { posts, totalPages, count },
    null,
    "Get Posts from User Successful"
  )
})
postController.getCommentsOfAPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id
  let page = parseInt(req.query.page) || 1
  let limit = parseInt(req.query.limit) || 10

  // validate
  let post = await Post.findById(postId)
  if (!post) {
    throw new AppError(400, "Post not found", "Get Comments Error")
  }

  // process
  const count = await Comment.countDocuments({ post: postId })
  const totalPages = Math.ceil(count / limit)
  const offset = limit * (page - 1)

  let comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("author")

  return sendResponse(
    res,
    200,
    true,
    { comments, totalPages, count },
    null,
    "Comment Get Successfully"
  )
})
module.exports = postController
