import prisma from "../db.js";

export function createUser(data) {
  return prisma.user.create({ data });
}

export function listUsers({ page, limit, sortBy = "createdAt", order = "desc", isPrivate, search, hasPosts }) {
  const where = {};
  if (isPrivate !== undefined) where.isPrivate = isPrivate;
  if (hasPosts !== undefined) {
    where.posts = hasPosts ? { some: {} } : { none: {} };
  }
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { fullname: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
}

export function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { posts: true, likes: true } } },
  });
}

export function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data });
}

export function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

export function listUserPosts(id, page, limit) {
  return prisma.$transaction([
    prisma.post.findMany({
      where: { authorId: id },
      include: { _count: { select: { likes: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where: { authorId: id } }),
  ]);
}

export function listLikedPosts(id, page, limit) {
  const where = { likes: { some: { userId: id } } };
  return prisma.$transaction([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, fullname: true } },
        _count: { select: { likes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);
}
