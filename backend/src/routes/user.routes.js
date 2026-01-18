import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import {
  registerUser,
  checkMatch,
  updateCandidate,
  loginUser,
  logoutUser
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const userRouter = Router();


userRouter.route("/register").post(upload.none(), registerUser);
userRouter.route("/login").post(upload.none(), loginUser);


userRouter.route("/logout").post(verifyJWT, logoutUser);

userRouter.route("/match").post(
  verifyJWT,
  upload.none(),
  checkMatch
);

userRouter.route("/update").post(
  verifyJWT,
  upload.none(),
  updateCandidate
);

export { userRouter };