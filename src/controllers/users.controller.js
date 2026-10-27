import prisma from "../db.js";
import { parsePagination } from "../utils/pagination.js";
import * as users from "../services/users.service.js";

function prismaNotFound(error) {
  return error?.code === "P2025";
}

export async function create(req, res) {
  const { username, email, fullname, bio } = req.body ?? {};
  if (!username || !email || !fullname) {
    return res.status(400).json({ error: "username, email and fullname are required" });
  }

  try {
    const user = await users.createUser({
      username,
      email,
      fullname,
      ...(bio !== undefined ? { bio } : {}),
    });
    return res.status(201).json(user);
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "username or email already taken" });
    }
    throw error;
  }
}

export async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) return res.status(400).json({ error: pagination.error });

  if (req.query.sortBy !== undefined && !["createdAt", "username", "fullname"].includes(req.query.sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, username, fullname" });
  }
  if (req.query.order !== undefined && !["asc", "desc"].includes(req.query.order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }
  if (req.query.isPrivate !== undefined && !["true", "false"].includes(req.query.isPrivate)) {
    return res.status(400).json({ error: "isPrivate must be true or false" });
  }
  if (req.query.hasPosts !== undefined && !["true", "false"].includes(req.query.hasPosts)) {
    return res.status(400).json({ error: "hasPosts must be true or false" });
  }

  const options = {
    ...pagination,
    sortBy: req.query.sortBy ?? "createdAt",
    order: req.query.order ?? "desc",
    search: req.query.search,
  };
  if (req.query.isPrivate !== undefined) options.isPrivate = req.query.isPrivate === "true";
  if (req.query.hasPosts !== undefined) options.hasPosts = req.query.hasPosts === "true";

  const [data, total] = await users.listUsers(options);
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
  const user = await users.getUserById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.status(200).json(user);
}

export async function update(req, res) {
  const data = {};
  if ("fullname" in (req.body ?? {})) data.fullname = req.body.fullname;
  if ("bio" in (req.body ?? {})) data.bio = req.body.bio;
  if ("isPrivate" in (req.body ?? {})) data.isPrivate = req.body.isPrivate;

  try {
    const user = await users.updateUser(Number(req.params.id), data);
    return res.status(200).json(user);
  } catch (error) {
    if (prismaNotFound(error)) return res.status(404).json({ error: "User not found" });
    throw error;
  }
}

export async function remove(req, res) {
  try {
    await users.deleteUser(Number(req.params.id));
    return res.status(204).send();
  } catch (error) {
    if (prismaNotFound(error)) return res.status(404).json({ error: "User not found" });
    throw error;
  }
}

export async function getPosts(req, res) {
  const id = Number(req.params.id);
  const pagination = parsePagination(req.query);
  if (pagination.error) return res.status(400).json({ error: pagination.error });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const [data, total] = await users.listUserPosts(id, pagination.page, pagination.limit);
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

export async function getLikedPosts(req, res) {
  const id = Number(req.params.id);
  const pagination = parsePagination(req.query);
  if (pagination.error) return res.status(400).json({ error: pagination.error });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const [data, total] = await users.listLikedPosts(id, pagination.page, pagination.limit);
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
