import prisma from "../db.js";

export function getPostLikes(postId) {
  return prisma.like.findMany({
    where: { postId },
    select: {
      user: { select: { id: true, username: true, fullname: true } },
    },
    orderBy: { user: { username: "asc" } },
  });
}

export function createLike(postId, userId) {
  return prisma.like.create({
    data: { postId, userId },
  });
}

export function deleteLike(postId, userId) {
  return prisma.like.delete({
    where: { userId_postId: { userId, postId } },
  });
}
