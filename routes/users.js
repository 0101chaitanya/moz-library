const router = require("express").Router();
const moment = require("moment");
//const { Story, Author } = require("../models/schema");
/* GET users listing. */
router.get("/", function (req, res, next) {
  const bob = new Author({ name: "Bob Smith" });
  bob.save((err) => {
    if (err) return handleError(err);

    const story = new Story({
      title: "Bob goes sledging",
      author: bob._id,
    });

    story.save((err) => {
      if (err) return handleError(err);

      Story.findOne({ title: "Bob goes sledging" })
        .populate("author")
        .exec((err, result) => {
          if (err) return handleError(err);
          res.send(`The author is ${result.author.name}`);
        });

      Story.find({ author: bob._id }).exec((err, stories) => {
        res.send(stories);
      });
    });
  });
});

router.get("/cool", (req, res, next) => {
  res.send("I'm sicc");
});

module.exports = router;
