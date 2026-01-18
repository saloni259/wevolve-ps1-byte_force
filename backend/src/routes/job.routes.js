import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { addJob } from "../controllers/job.controllers.js";

const jobRouter = Router();

jobRouter.get("/test", (req, res) => {
  res.send("Job route working");
});

jobRouter.route("/addjob").post(addJob)

export { jobRouter };