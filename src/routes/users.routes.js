import { Router } from "express";
import * as users from "../controllers/users.controller.js";

const router = Router();

router.post("/", users.create);
router.get("/", users.list);
router.get("/:id/liked-posts", users.getLikedPosts);
router.get("/:id/posts", users.getPosts);
router.get("/:id", users.getOne);
router.patch("/:id", users.update);
router.delete("/:id", users.remove);

export default router;
