const express = require("express")
const authentication = require("../middlewares/authentication")
const reactionController = require("../controllers/reaction.controller")
const validators = require("../middlewares/validators")
const { body } = require("express-validator")
const router = express.Router()

/**
 * @route POST api/reactions
 * @description Save a reaction to post or comment
 * @access Login required
 */
router.post(
  "/",
  validators.validate([
    body("targetType", "Invalid Target Type")
      .exists()
      .isIn(["Post", "Comment"]),
    body("emoji", "Invalid Emoji").exists().isIn(["like, dislike"]),
    body("targetId", "Invalid Target Id")
      .exists()
      .isString()
      .custom(validators.checkObjectId),
  ]),
  authentication.loginRequired,
  reactionController.saveReaction
)
module.exports = router
