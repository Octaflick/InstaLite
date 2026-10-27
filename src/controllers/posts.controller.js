import prisma from "../db.js";
import { parsePagination } from "../utils/pagination.js";
import * as posts from "../services/posts.service.js";

function prismaNotFound(error) {
  return error?.code === "P2025";
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function create(req, res) {
  const { imageUrl, caption, location, authorId } = req.body ?? {};
  if (!imageUrl || authorId === undefined) {
    return res.status(400).json({ error: "imageUrl and authorId are required" });
  }

  const author = await prisma.user.findUnique({ where: { id: Number(authorId) } });
  if (!author) return res.status(404).json({ error: "User not found" });

  const post = await posts.createPost({
    imageUrl,
    authorId: Number(authorId),
    ...(caption !== undefined ? { caption } : {}),
    ...(location !== undefined ? { location } : {}),
  });
  return res.status(201).json(post);
}

export async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) return res.status(400).json({ error: pagination.error });
  if (req.query.sortBy !== undefined && !["createdAt", "updatedAt", "likes"].includes(req.query.sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, updatedAt, likes" });
  }
  if (req.query.order !== undefined && !["asc", "desc"].includes(req.query.order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }
  if ((req.query.from !== undefined && !validDate(req.query.from)) ||
      (req.query.to !== undefined && !validDate(req.query.to))) {
    return res.status(400).json({ error: "from and to must be valid dates" });
  }

  const options = {
    ...pagination,
    sortBy: req.query.sortBy ?? "createdAt",
    order: req.query.order ?? "desc",
    location: req.query.location,
    search: req.query.search,
  };
  if (req.query.from) options.from = new Date(`${req.query.from}T00:00:00.000Z`);
  if (req.query.to) options.to = new Date(`${req.query.to}T00:00:00.000Z`);

  const [data, total] = await posts.listPosts(options);
  return res.status(200).json({
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  });
}

export async function getOne(req, res) {
  const post = await posts.getPostById(Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });
  return res.status(200).json(post);
}

export async function update(req, res) {
  const data = {};
  if ("caption" in (req.body ?? {})) data.caption = req.body.caption;
  if ("location" in (req.body ?? {})) data.location = req.body.location;

  try {
    const post = await posts.updatePost(Number(req.params.id), data);
    return res.status(200).json(post);
  } catch (error) {
    if (prismaNotFound(error)) return res.status(404).json({ error: "Post not found" });
    throw error;
  }
}

export async function remove(req, res) {
  try {
    await posts.deletePost(Number(req.params.id));
    return res.status(204).send();
  } catch (error) {
    if (prismaNotFound(error)) return res.status(404).json({ error: "Post not found" });
    throw error;
  }
}
