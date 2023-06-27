const mongoose = require("mongoose")
const { catchAsync, sendResponse, AppError } = require("../helpers/utils")
const Reaction = require("../models/Reaction")

const reactionController = {}

const calculateReaction = async (targetId, targetType) => {
  console.log(targetId, "targetid")
  const stats = await Reaction.aggregate([
    {
      $match: { targetId: new mongoose.Types.ObjectId(targetId) },
    },
    {
      $group: {
        _id: "$targetId",
        like: {
          $sum: {
            $cond: [{ $eq: ["$emoji", "like"] }, 1, 0],
          },
        },
        dislike: {
          $sum: {
            $cond: [{ $eq: ["$emoji", "dislike"] }, 1, 0],
          },
        },
      },
    },
  ])
  const reactions = {
    like: (stats[0] && stats[0].like) || 0,
    dislike: (stats[0] && stats[0].dislike) || 0,
  }
  await mongoose.model(targetType).findByIdAndUpdate(targetId, { reactions })
  return reactions
}

reactionController.saveReaction = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId
  const { targetType, targetId, emoji } = req.body

  // check targetType exists
  const targetObj = await mongoose.model(targetType).findById(targetId)

  if (!targetObj) {
    throw new AppError(400, `${targetType} not found`, `Create Reaction Error`)
  }
  // find the reactions if exists
  let reaction = await Reaction.findOne({
    author: currentUserId,
    targetType,
    targetId,
  })

  // if there is no reaction in the DB => create a new one
  let message = ""
  if (!reaction) {
    reaction = await Reaction.create({
      author: currentUserId,
      targetType,
      targetId,
      emoji,
    })
    message = "Added reaction"
  } else {
    // If there is a previous reaction in the DB => compare the mojis
    // If they are the same => delete the reaction
    if (reaction.emoji === emoji) {
      await reaction.deleteOne()
      message = "Deleted reaction"
    } else {
      // If they are different => update the reaction
      reaction.emoji = emoji
      await reaction.save()
      message = "Updated reaction"
    }
  }
  const reactions = await calculateReaction(targetId, targetType)

  return sendResponse(res, 200, true, reactions, null, message)
})

module.exports = reactionController
