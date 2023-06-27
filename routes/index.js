var express = require("express")
var router = express.Router()

//authApi
const authApi = require("./auth.api")
router.use("/auth", authApi)

//postApi
const postApi = require("./post.api")
router.use("/posts", postApi)

//friendApi
const friendApi = require("./friend.api")
router.use("/friends", friendApi)

//commentApi
const commentApi = require("./comment.api")
router.use("/comments", commentApi)

//reactionApi
const reactionApi = require("./reaction.api")
router.use("/reactions", reactionApi)

//userApi
const userApi = require("./user.api")
router.use("/users", userApi)

module.exports = router
