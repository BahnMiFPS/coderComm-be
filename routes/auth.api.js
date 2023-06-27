const express = require("express")
const authController = require("../controllers/auth.controller")
const { validate } = require("../middlewares/validators")
const { body } = require("express-validator")
const router = express.Router()
/**
 * @route POST /auth/login
 * @description Log in with email and password
 * @access Public
 */
router.post(
  "/login",
  validate([
    body("email", "Invalid Email")
      .exists()
      .isEmail()
      .normalizeEmail({ gmail_remove_dots: false }),
    body("password", "Invalid Password").exists().notEmpty(),
  ]),
  authController.login
)

/**
 * @route POST /auth/login/facebook
 * @description Login with facebook
 * @access Public
 */

/**
 * @route POST /auth/login/google
 * @description Login with google
 * @access Public
 */
module.exports = router
