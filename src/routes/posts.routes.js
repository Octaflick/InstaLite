import { Router } from "express";
import * as posts from "../controllers/posts.controller.js";
import * as likes from "../controllers/likes.controller.js";

const router = Router();

router.post("/", posts.create);
router.get("/", posts.list);
router.get("/:id/likes", likes.list);
router.post("/:id/likes", likes.create);
router.delete("/:id/likes/:userId", likes.remove);
router.get("/:id", posts.getOne);
router.patch("/:id", posts.update);
router.delete("/:id", posts.remove);

export default router;
