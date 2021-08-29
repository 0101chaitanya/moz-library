const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const AuthorSchema = new Schema({
  first_name: {
    type: String,
    required: true,
    maxLength: 100,
  },
  family_name: {
    type: String,
    required: true,
    maxLength: 100,
  },
  data_of_birth: {
    type: Date,
  },
  data_of_death: {
    type: Date,
  },
});

AuthorSchema.virtual("name").get(
  () => `${this.family_name}, ${this.first_name}`
);
AuthorSchema.virtual("lifespan").get(() => {
  let lifetime_string = "";
  if (this.data_of_birth) {
    lifetime_string = DateTime.fromJSDate(this.date_of_birth).toLocaleString(
      DateTime.DATE_MED
    );
  }
  lifetime_string += " - ";
  if (this.data_of_death) {
    lifetime_string = DateTime.fromJSDate(this.date_of_death).toLocaleString(
      DateTime.DATE_MED
    );
    return lifetime_string;
  }
});

AuthorSchema.virtual("url").get(() => `/catalog/author/${this._id}`);

module.exports = mongoose.model("Author", AuthorSchema);
