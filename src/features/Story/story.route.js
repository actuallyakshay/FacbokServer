const express = require("express");
const User = require("../Auth/auth.model");
const Story = require("./story.model");

const app = express.Router();

const authMiddleWare = async (req, res, next) => {
  let token = req.headers.token;
  console.log({ token });
  if (!token) {
    return res.send("missing token");
  }
  const [email, id, password] = token.split(":");
  try {
    let user = await User.findOne({ email });
    if (user) {
      if (password === user.password) {
        req.userId = user.id;
        next();
      } else {
        res.status(400).send("Auth Failure");
      }
    } else {
      res.status(400).send(`${email} not found`);
    }
  } catch (e) {
    res.status(404).send(e.message);
  }
};

app.get("", async (req, res) => {
  let story = await Story.find().populate(["user"]);
  story.reverse();
  res.send(story);
});

app.post("", authMiddleWare, async (req, res) => {
  try {
    let temp = await Story.create({
      ...req.body,
      user: req.userId,
    });
    res.send(temp);
  } catch (e) {
    res.send(e.message);
  }
});

module.exports = app;
