const express = require("express")
const authentication = require("../middlewares/authentication")
const postController = require("../controllers/post.controller")
const validators = require("../middlewares/validators")
const { body, param } = require("express-validator")
const router = express.Router()

/**
 * @route POST /posts
 * @description Create a new post
 * @access Login required
 */
router.post(
  "/",
  authentication.loginRequired,
  validators.validate([body("content", "Invalid Content").exists().notEmpty()]),
  postController.createPost
)

/**
 * @route GET /posts/user/:userId?page=1&limit=10
 * @description Get all posts an user can see with pagination
 * @access Login required
 */
router.get(
  "/user/:userId",
  authentication.loginRequired,
  validators.validate([
    param("userId").exists().isString().custom(validators.checkObjectId),
  ]),
  postController.getPostFromUserId
)
/**
 * @route GET /posts/:id
 * @description Get a single post
 * @access Login required
 */
router.get(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  postController.getPostById
)
/**
 * @route PUT /posts/:id
 * @description Update a post
 * @access Login required
 */
router.put(
  "/:id",
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  authentication.loginRequired,
  postController.updatePost
)

/**
 * @route DELETE /posts/:id
 * @description Delete a post
 * @access Login required
 */
router.delete(
  "/:id",
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  authentication.loginRequired,
  postController.deleteSinglePost
)
/**
 * @route GET /posts/:id/comments
 * @description Get comments of a post
 * @access Login required
 */
router.get(
  "/:id/comments",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().notEmpty().custom(validators.checkObjectId),
  ]),
  postController.getCommentsOfAPost
)
module.exports = router
