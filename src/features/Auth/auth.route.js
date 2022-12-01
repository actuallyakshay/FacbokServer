const express = require("express");
const mongoose = require("mongoose");
const User = require("./auth.model");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const app = express.Router();

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

app.get("/:id", async (req, res) => {
  try {
    let users = await User.findOne({ _id: req.params.id });

    res.send(users);
  } catch (e) {
    res.send(e.message);
  }
});

app.get("", async (req, res) => {
  const { q } = req.query;
  try {
    if (q) {
      let temp = new RegExp(q, "i");
      let users = await User.find({ fName: temp });
      res.send(users);
    } else {
      let users = await User.find();
      res.send(users);
    }
  } catch (e) {
    res.send(e.message);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email: email });
  if (user) {
    if (password === user.password) {
      res.send({
        token: `${user.email}:${user._id}:${user.password}`,
      });
    } else {
      res.send("password is incorrect");
    }
  } else {
    res.send("You have to Signup first");
  }
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email: email });
  const accessToken = await oAuth2Client.getAccessToken();
  if (user) {
    res.send("user already exist");
  } else {
    let user = await User.create(req.body);
    let mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "actuallyakshay009@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });
    let details = {
      from: "AKSHAY RAJPUT 📩  <actuallyakshay009@gmail.com>",
      to: email,
      subject: `Welcome to my facebook`,
      text: `I'am really help to see you here!
       Please! explore this application `,
    };
    mailTransporter.sendMail(details, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Email has sent");
      }
    });
    console.log("first");
    res.send("Acc created Successfully");
  }
});

app.patch("", async (req, res) => {
  console.log(req.headers.token);
  const [email, _id, password] = req.headers.token.split(":");
  const {
    bio,
    image,
    cover_image,
    city,
    lives_in,
    status,
    works_at,
    worked_at,
    number,
    school,
    intersted_in,
    about_you,
    favourite_quote,
    life_event,
    user_name,
    user_image,
    type,
  } = req.body;

  if (type == "friends") {
    let friend = await User.findById(_id);
    if (
      friend.find((el) => {
        if (el.user_name == user_name) {
          return true;
        } else {
          return false;
        }
      })
    ) {
      return res.send("Already exist");
    } else {
      let temp = await User.findByIdAndUpdate(_id, {
        $push: {
          friends: { user_name, user_image },
        },
      });
      res.send(temp);
    }
  } else if (type == "followers") {
    let temp = await User.findByIdAndUpdate(_id, {
      $push: {
        followers: { user_name, user_image },
      },
    });
    res.send(temp);
  } else if (type == "removeFriend") {
    let temp = await User.findByIdAndUpdate(_id, {
      $pull: {
        friends: { user_name, user_image },
      },
    });
    res.send(temp);
  } else {
    console.log({ lives_in });
    let temp = await User.findByIdAndUpdate(
      { _id: _id },
      {
        $set: {
          "userDetails.bio": bio,
          "userDetails.image": image,
          "userDetails.cover_image": cover_image,
          "userDetails.city": city,
          "userDetails.lives_in": lives_in,
          "userDetails.status": status,
          "userDetails.works_at": works_at,
          "userDetails.number": number,
          "userDetails.school": school,
          "userDetails.intersted_in": intersted_in,
          "userDetails.about_you": about_you,
          "userDetails.favourite_quote": favourite_quote,
        },
        $push: {
          "userDetails.life_event": life_event,
          "userDetails.worked_at": worked_at,
        },
      }
    );
    res.send(temp);
  }
});

let arr = [];

app.patch("/getotp", async (req, res) => {
  const { email } = req.body;
  arr = [];
  try {
    let user = await User.findOne({ email });
    const accessToken = await oAuth2Client.getAccessToken();
    if (user) {
      let temp = Math.floor(Math.random() * 10000) + 1;
      arr.push(temp);
      let mailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "actuallyakshay009@gmail.com",
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });
      let details = {
        from: "AKSHAY RAJPUT 📩  <actuallyakshay009@gmail.com>",
        to: email,
        subject: `change your password`,
        text: ` your otp is ${arr[0]}`,
      };
      mailTransporter.sendMail(details, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Email has sent");
        }
      });
      res.send("otp has send");
    } else {
      return res.send("user not found");
    }
  } catch (e) {
    res.send(e.message);
  }
});

app.patch("/resetpassword", async (req, res) => {
  let { email, otp, password } = req.body;
  try {
    let user = await User.findOne({ email });
    const accessToken = await oAuth2Client.getAccessToken();
    if (user) {
      if (otp == arr[0]) {
        let temp = await User.findOneAndUpdate(
          { email },
          { $set: { password: password } }
        );
        let mailTransporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: "actuallyakshay009@gmail.com",
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken,
          },
        });
        let details = {
          from: "AKSHAY RAJPUT 📩  <actuallyakshay009@gmail.com>",
          to: email,
          subject: `PasswordUpdated`,
          text: `Password Updated successfully, Please explore this application`,
        };
        mailTransporter.sendMail(details, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Email has sent");
          }
        });
        res.status(202).send(temp);
      } else {
        return res.status(403).send("Invalid otp");
      }
    } else {
      res.status(404).send("No User found");
    }
  } catch (e) {
    res.status(400).send(e.message);
  }
});

module.exports = app;
