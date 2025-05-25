// src/modules/Like/like.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // Initialize PrismaClient once

/**
 * Records a like for a post by a user.
 * @param postId The ID of the post being liked.
 * @param userId The ID of the user who liked the post.
 * @returns The created like object.
 */
export const likePost = async (postId: string, userId: string) => {
  try {
    const like = await prisma.like.create({
      data: {
        post: { connect: { id: postId } },
        user: { connect: { id: userId } },
      },
    });
    return like;
  } catch (error) {
    // Catch unique constraint violation if user tries to like same post twice
    if ((error as any).code === 'P2002') {
      console.warn(`User ${userId} already liked post ${postId}.`);
      throw new Error("You have already liked this post.");
    }
    console.error("Error liking post:", error);
    throw error;
  }
};

/**
 * Removes a like from a post by a user.
 * @param postId The ID of the post to unlike.
 * @param userId The ID of the user who is unliking the post.
 * @returns The deleted like object.
 */
export const unlikePost = async (postId: string, userId: string) => {
  try {
    const like = await prisma.like.delete({
      where: {
        postId_userId: { // Unique compound ID
          postId: postId,
          userId: userId,
        },
      },
    });
    return like;
  } catch (error) {
    console.error("Error unliking post:", error);
    throw error;
  }
};

/**
 * Gets the total number of likes for a specific post.
 * @param postId The ID of the post.
 * @returns The number of likes.
 */
export const getLikeCount = async (postId: string) => {
  try {
    const count = await prisma.like.count({
      where: { postId: postId },
    });
    return count;
  } catch (error) {
    console.error("Error getting like count:", error);
    throw error;
  }
};

/**
 * Checks if a user has liked a specific post.
 * @param postId The ID of the post.
 * @param userId The ID of the user.
 * @returns True if the user liked the post, false otherwise.
 */
export const hasUserLikedPost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: userId,
        },
      },
    });
    return !!like;
  } catch (error) {
    console.error("Error checking if user liked post:", error);
    throw error;
  }
};