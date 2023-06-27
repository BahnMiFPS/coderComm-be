const express = require("express")
const userController = require("../controllers/user.controller")
const { body, param } = require("express-validator")
const { validate, checkObjectId } = require("../middlewares/validators")
const authentication = require("../middlewares/authentication")
const router = express.Router()
/**
 * @route POST /users
 * @description Register new user
 * @access Public
 */
router.post(
  "/",
  validate([
    body("name", "Invalid Name").exists().notEmpty(),
    body("email", "Invalid Email")
      .exists()
      .isEmail()
      .normalizeEmail({ gmail_remove_dots: false }),
    body("password", "Invalid Password").exists().notEmpty(),
  ]),
  userController.register
)

/**
 * @route GET /users/me
 * @description Get current user info
 * @access Login required
 */

router.get("/me", authentication.loginRequired, userController.getCurrentUser)

/**
 * @route GET /users?page=1&limit=10
 * @description Get users with pagination
 * @access Login required
 */
router.get("/", authentication.loginRequired, userController.getUsers)

/**
 * @route GET /users/:id
 * @description Get a user profile
 * @access Login required
 */
router.get(
  "/:id",
  authentication.loginRequired,
  validate([param("id").exists().isString().custom(checkObjectId)]),
  userController.getUserById
)

/**
 * @route PUT /users/:id
 * @description Update user profile
 * @access Login required
 */
router.put(
  "/:id",
  validate([param("id").exists().isString().custom(checkObjectId)]),
  authentication.loginRequired,
  userController.updateUser
)

module.exports = router
