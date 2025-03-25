const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const userModel = require("../models/user.models");
const postModel = require("../models/post.model");

// register
const register = async (req, res) => {
  const { email, phone, name, password} = req.body;
  const photo = `/image/${req.file.filename}`;
  console.log(photo)

  const foundUser = await userModel.findOne({ $or: [{ email }, { phone }] });
  if (foundUser) {
    return res.json("کاربر از قبل وجود دارد ! ");
  }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const newUser = await userModel.create({
        email,
        name,
        phone,
        profPhoto:photo,
        password: hash,
      });
    });
    let token = jwt.sign(
      { email: email, userId: userModel._id },
      process.env.PRIMARY_KEY
    );
    res.cookie("token", token);
    res.render("login");
  });
};

// login
const login = async (req, res) => {
  let errors = [];
  const { email, password } = req.body;
  const foundUser = await userModel.findOne({ $or: [{ email }] });
  if (foundUser) {
    const PasswordisCorrect = await bcrypt.compare(
      password,
      foundUser.password
    );
    if (PasswordisCorrect) {
      let token = jwt.sign(
        { _id: foundUser._id, email: foundUser.email },
        process.env.PRIMARY_KEY
      );
      res.cookie("token", token);
      res.redirect("profile");
    } else res.json({ msg: "your password is not match" });
  } else {
    errors.push({ msg: "شما در داخل دیتابیس ثبت نشده اید !" });
    res.render("login", { errors });
  }
};

// logout
const logout = (req, res) => {
  res.cookie("token", "");
  res.json({ msg: "token went remove" });
};

// getLogin
const getLogin = (req, res) => {
  res.render("login");
};

// profile
const profile = async (req, res) => {
  const user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  res.render("AllPost", { user });
  console.log(user)
};
 
//post
const post = async (req, res) => {
  try {
    console.log("Uploaded File:", req.file);

    const user = await userModel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    let { content } = req.body;
    let newImagePost = req.file ? `/image/${req.file.filename}` : null;

    let newPost = await postModel.create({
      user: user._id,
      content,
      newImagePost,
    });

    user.posts.push(newPost._id);
    await user.save();

    res.redirect("/profile");
  } catch (error) {
    console.error("Error in post creation:", error);
    res.status(500).json({ message: "خطای سرور رخ داد" });
  }
};

// show all post for client
const AllPost = async (req, res) => {
  const post = await userModel.find().populate("posts");
  res.render("home", { post });
};


module.exports = {
  register,
  login,
  logout,
  getLogin,
  profile,
  post,
  AllPost,
};
