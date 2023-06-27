const express = require("express")
const validators = require("../middlewares/validators")
const { body, param } = require("express-validator")
const authentication = require("../middlewares/authentication")
const commentController = require("../controllers/comment.controller")
const router = express.Router()

/**
 * @route POST api/comments
 * @description Create a new comment
 * @access Login required
 */
router.post(
  "/",
  authentication.loginRequired,
  validators.validate([
    body("content", "Invalid Content").exists().notEmpty(),
    body("postId").exists().notEmpty().custom(validators.checkObjectId),
  ]),
  commentController.createComment
)

/**
 * @route GET api/comments/:id
 * @description Get details of a comment
 * @access Login required
 */
router.get(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().notEmpty().custom(validators.checkObjectId),
  ]),
  commentController.getComment
)
/**
 * @route PUT api/comments/:id
 * @description Update a comment
 * @access Login required
 */
router.put(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    body("content", "Invalid Content").exists().notEmpty(),
    param("id").exists().notEmpty().custom(validators.checkObjectId),
  ]),
  commentController.updateComment
)
/**
 * @route DELETE api/comments/:id
 * @description Delete a comment
 * @access Login required
 */
router.delete(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().notEmpty().custom(validators.checkObjectId),
  ]),
  commentController.deleteComment
)

module.exports = router
