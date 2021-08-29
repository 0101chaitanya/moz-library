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
GenreSchema.virtual("url").get(() => `/catalog/genre/${this.name}`);

module.exports = mongoose.model("genre", GenreSchema);
