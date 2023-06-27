const express = require("express")
const validators = require("../middlewares/validators")
const { body, param } = require("express-validator")
const friendController = require("../controllers/friend.controller")
const authentication = require("../middlewares/authentication")
const router = express.Router()

/**
 * @route POST /friends/requests
 * @description Send a friend request
 * @access Login required
 */

router.post(
  "/requests",
  authentication.loginRequired,
  validators.validate([
    body("to", "Invalid User")
      .exists()
      .isString()
      .custom(validators.checkObjectId),
  ]),
  friendController.sendFriendRequest
)

/**
 * @route GET /friends/requests/incoming
 * @description Get the list of received pending requests
 * @access Login required
 */
router.get(
  "/requests/incoming",
  authentication.loginRequired,
  friendController.getIncomingRequests
)
/**
 * @route GET /friends/requests/outgoing
 * @description Get the list of sent pending requests
 * @access Login required
 */
router.get(
  "/requests/outgoing",
  authentication.loginRequired,
  friendController.getOutgoingRequests
)
/**
 * @route GET /friends
 * @description Get the list of friends
 * @access Login required
 */
router.get("/", authentication.loginRequired, friendController.getFriendlists)

/**
 * @route PUT /friends/requests/:userId
 * @description Accept/Reject a received pending requests
 * @access Login required
 */
router.put(
  "/requests/:id",
  authentication.loginRequired,
  validators.validate([
    param("id", "Invalid User Id")
      .exists()
      .isString()
      .custom(validators.checkObjectId),
    body("status", "Invalid Status")
      .exists()
      .notEmpty()
      .isIn(["accepted", "declined"]),
  ]),
  friendController.reactFriendRequest
)

/**
 * @route DELETE /friends/requests/:userId
 * @description Cancel a friend request
 * @access Login required
 */
router.delete(
  "/requests/:id",
  authentication.loginRequired,
  validators.validate([
    param("id", "Invalid User Id")
      .exists()
      .isString()
      .custom(validators.checkObjectId),
  ]),
  friendController.cancelFriendRequest
)

/**
 * @route DELETE /friends/:userId
 * @description Remove a friend
 * @access Login required
 */
router.delete(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id", "Invalid User Id")
      .exists()
      .isString()
      .custom(validators.checkObjectId),
  ]),
  friendController.removeFriend
)
module.exports = router
