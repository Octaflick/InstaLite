import prisma from "../db.js";

export function createPost(data) {
  return prisma.post.create({ data });
}

export function listPosts({ page, limit, sortBy = "createdAt", order = "desc", location, search, from, to }) {
  const where = {};
  if (location) {
    where.location = { equals: location, mode: "insensitive" };
  }
  if (search) {
    where.caption = { contains: search, mode: "insensitive" };
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;
  }

  let orderBy;
  if (sortBy === "likes") {
    orderBy = [
      { likes: { _count: order } },
      { createdAt: "desc" },
    ];
  } else {
    orderBy = { [sortBy]: order };
  }

  return prisma.$transaction([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, fullname: true } },
        _count: { select: { likes: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);
}

export function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, fullname: true } },
      _count: { select: { likes: true } },
    },
  });
}

export function updatePost(id, data) {
  return prisma.post.update({ where: { id }, data });
}

export function deletePost(id) {
  return prisma.post.delete({ where: { id } });
}
