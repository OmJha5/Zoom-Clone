import { Router } from "express";
import { addCurrMeeting, checkUser, getCurrUserAllMeetings, login, logout, register } from "../controller/user.controller.js";
const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/checkuser").get(checkUser);
router.route("/addCurrMeeting").post(addCurrMeeting);
router.route("/getCurrUserAllMeetings").post(getCurrUserAllMeetings);
router.route("/logout").get(logout);

export default router;