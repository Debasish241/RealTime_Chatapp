import express from "express";
import {
  loginUser,
  verifyUser,
  myProfile,
  getAllUsers,
  getaUser,
  updateName,
} from "../controllers/user.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();
router.post("/login", loginUser);
router.post("/verify", verifyUser);
router.get("/me", isAuth, myProfile);
router.get("/user/all", isAuth, getAllUsers);
router.get("/user/:id", getaUser);
router.post("/update/user", isAuth, updateName);

export default router;
