import prisma from "../db.js";
import * as likes from "../services/likes.service.js";

export async function list(req, res) {
  const postId = Number(req.params.id);
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const rows = await likes.getPostLikes(postId);
  return res.status(200).json(rows.map((row) => row.user));
}

export async function create(req, res) {
  const postId = Number(req.params.id);
  const userId = req.body?.userId;
  if (userId === undefined) return res.status(400).json({ error: "userId is required" });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    const like = await likes.createLike(postId, Number(userId));
    return res.status(201).json(like);
  } catch (error) {
    if (error?.code === "P2002") return res.status(409).json({ error: "Already liked" });
    throw error;
  }
}

export async function remove(req, res) {
  try {
    await likes.deleteLike(Number(req.params.id), Number(req.params.userId));
    return res.status(204).send();
  } catch (error) {
    if (error?.code === "P2025") return res.status(404).json({ error: "Like not found" });
    throw error;
  }
}
