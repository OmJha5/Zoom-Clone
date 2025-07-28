import { Router } from "express";
import { checkUser, login, register } from "../controller/user.controller.js";
const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/checkuser").get(checkUser);
router.route("/add_to_activity");
router.route("/get_all_activity");

export default router;