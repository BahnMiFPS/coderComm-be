const { catchAsync, sendResponse, AppError } = require("../helpers/utils")
const Comment = require("../models/Comment")
const Post = require("../models/Post")

const commentController = {}

const calculateCommentCount = async (postId) => {
  const commentCount = await Comment.countDocuments({
    post: postId,
  })
  console.log(
    "🚀 ~ file: comment.controller.js:12 ~ calculateCommentCount ~ commentCount:",
    commentCount
  )
  await Post.findByIdAndUpdate(postId, { commentCount: commentCount })
}

commentController.register = catchAsync(async (req, res, next) => {
  res.send("Comment Registration")
})

commentController.createComment = catchAsync(async (req, res, next) => {
  const { content, postId } = req.body
  const currentUserId = req.userId

  // Check post exists
  let post = await Post.findById(postId)
  if (!post) {
    throw new AppError(400, "Post Dont Exist", "Comment Create Error")
  }

  // Create New Comment
  let comment = await Comment.create({
    author: currentUserId,
    post: postId,
    content,
  })
  // Update CommentCount
  await calculateCommentCount(postId)
  comment = await comment.populate("author")

  return sendResponse(
    res,
    200,
    true,
    comment,
    null,
    "Comment Posted Successfully"
  )
})
commentController.updateComment = catchAsync(async (req, res, next) => {
  const { content } = req.body
  const commentId = req.params.id
  const currentUserId = req.userId

  let comment = await Comment.findOneAndUpdate(
    { author: currentUserId, _id: commentId },
    { content },
    { new: true }
  )
  if (!comment) {
    throw new AppError(
      400,
      "Comment not found or User not authorized",
      "Update Comment Error"
    )
  }
  // Update CommentCount

  return sendResponse(
    res,
    200,
    true,
    comment,
    null,
    "Comment Updated Successfully"
  )
})

commentController.deleteComment = catchAsync(async (req, res, next) => {
  const commentId = req.params.id
  const currentUserId = req.userId

  let comment = await Comment.findOneAndDelete({
    author: currentUserId,
    _id: commentId,
  })
  if (!comment) {
    throw new AppError(
      400,
      "Comment not found or User not authorized",
      "Delete Comment Error"
    )
  }

  // Update CommentCount
  await calculateCommentCount(comment.post)

  return sendResponse(
    res,
    200,
    true,
    comment,
    null,
    "Comment Deleted Successfully"
  )
})

commentController.getComment = catchAsync(async (req, res, next) => {
  const commentId = req.params.id

  let comment = await Comment.findById(commentId)
  if (!comment) {
    throw new AppError(400, "Comment not found", "Get Comment Error")
  }

  return sendResponse(res, 200, true, comment, null, "Comment Get Successfully")
})

module.exports = commentController
