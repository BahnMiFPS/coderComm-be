const mongoose = require("mongoose")
const Schema = mongoose.Schema

const friendSchema = new Schema(
  {
    from: { type: Schema.ObjectId, require: true, ref: "User" },
    to: { type: Schema.ObjectId, require: true, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
    },
  },
  { timestamps: true }
)

const Friend = mongoose.model("Friend", friendSchema)
module.exports = Friend
