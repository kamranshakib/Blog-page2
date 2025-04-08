const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const upload = multer({ dest: "public/image/" });

const {
  register,
  login,
  logout,
  getLogin,
  profile,
  post,
  AllPost,
  likess
} = require("../controllers/user.controller");

// بررسی لاگین بودن کاربر
function inLoggedin(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/login"); // اگر توکن نبود، کاربر را به لاگین بفرست
  }

  jwt.verify(token, process.env.PRIMARY_KEY, (err, decoded) => {
    if (err) {
      res.clearCookie("token"); // حذف توکن منقضی شده
      return res.redirect("/login"); // هدایت به لاگین
    }
    req.user = decoded; // ذخیره اطلاعات کاربر در `req.user`
    next();
  });
}

router.get("/profile", inLoggedin, profile);
router.get("/allPost", inLoggedin, AllPost);
router.post("/create-post", inLoggedin, upload.single("newImagePost"), post);
router.post("/register", upload.single("profPhoto"), register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/login", getLogin);
router.post("/like/:id", inLoggedin, likess);

module.exports = router;
