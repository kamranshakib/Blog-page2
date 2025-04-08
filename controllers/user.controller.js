const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.models");
const postModel = require("../models/post.model");
require("dotenv").config();

// ثبت‌نام کاربر
const register = async (req, res) => {
  try {
    const { email, phone, name, password } = req.body;
    const photo = req.file ? `/image/${req.file.filename}` : null;

    const foundUser = await userModel.findOne({ $or: [{ email }, { phone }] });
    if (foundUser) {
      return res.json("کاربر از قبل وجود دارد!");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
      email,
      name,
      phone,
      profPhoto: photo,
      password: hashedPassword,
    });

    let token = jwt.sign(
      { email: email, userId: newUser._id },
      process.env.PRIMARY_KEY,
      { expiresIn: "7d" } // توکن ۷ روزه
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // برای HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // ۷ روز
    });

    res.redirect("/profile");
  } catch (error) {
    res.status(500).json({ msg: "خطای سرور رخ داد" });
  }
};

// ورود کاربر
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const foundUser = await userModel.findOne({ email });

    if (!foundUser) {
      return res.json({ msg: "کاربر یافت نشد!" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      foundUser.password
    );
    if (!isPasswordCorrect) {
      return res.json({ msg: "رمز عبور اشتباه است!" });
    }

    let token = jwt.sign(
      { _id: foundUser._id, email: foundUser.email },
      process.env.PRIMARY_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/profile");
  } catch (error) {
    res.status(500).json({ msg: "خطای سرور رخ داد" });
  }
};

// خروج از حساب
const logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
};

// نمایش صفحه لاگین
const getLogin = (req, res) => {
  res.render("login");
};

// نمایش پروفایل کاربر
const profile = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.user.email })
      .populate("posts");
    res.render("AllPost", { user });
  } catch (error) {
    res.status(500).json({ msg: "خطای سرور رخ داد" });
  }
};

// ارسال پست جدید
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
    res.status(500).json({ message: "خطای سرور رخ داد" });
  }
};

// نمایش همه پست‌ها
const AllPost = async (req, res) => {
  try {
    const post = await userModel.find().populate("posts");
    res.render("home", { post });
  } catch (error) {
    res.status(500).json({ msg:"خطا " });
  }
};

const likess = async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("email");
  const userId = req.user.userId;

  if (post.likes.indexOf(userId) === -1) {
    post.likes.push(userId);
  } else {
    post.likes.splice(post.likes.indexOf(userId), 1);
  }

  await post.save();

  // ارسال داده‌ها به صورت JSON
  res.json({
    likes: post.likes,
    isLiked: post.likes.indexOf(userId) !== -1,
  });
};


module.exports = {
  register,
  login,
  logout,
  getLogin,
  profile,
  post,
  AllPost,
  likess
};
