const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var GenreSchema = new Schema({
  name: {
    type: String,
    required: true,
    min: 3,
    max: 100,
  },
});
GenreSchema.set("toObject", { virtuals: true });
GenreSchema.set("toJSON", { virtuals: true });

GenreSchema.virtual("url").get(function () {
  return `/catalog/genre/${this._id}`;
});

module.exports = mongoose.model("Genre", GenreSchema);
