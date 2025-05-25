// src/modules/Comment/comment.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // Initialize PrismaClient once

/**
 * Adds a new comment to a post.
 * @param postId The ID of the post to comment on.
 * @param authorId The ID of the user who is commenting.
 * @param content The content of the comment.
 * @returns The created comment object.
 */
export const addComment = async (postId: string, authorId: string, content: string) => {
  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        post: { connect: { id: postId } },
        author: { connect: { id: authorId } },
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
      },
    });
    return comment;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

/**
 * Deletes a comment. Only the author of the comment can delete it.
 * @param commentId The ID of the comment to delete.
 * @param authorId The ID of the user trying to delete the comment (must match the comment's author).
 * @returns The deleted comment object.
 */
export const deleteComment = async (commentId: string, authorId: string) => {
  try {
    // First, verify that the comment exists and belongs to the authorId
    const commentToDelete = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!commentToDelete) {
      throw new Error("Comment not found.");
    }
    if (commentToDelete.authorId !== authorId) {
      throw new Error("Unauthorized: You can only delete your own comments.");
    }

    const deletedComment = await prisma.comment.delete({
      where: { id: commentId },
    });
    return deletedComment;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

/**
 * Fetches comments for a specific post.
 * @param postId The ID of the post.
 * @param limit Optional. The number of comments to fetch (default: 10).
 * @param lastCommentId Optional. The ID of the last comment for pagination.
 * @returns An array of comment objects.
 */
export const getCommentsForPost = async (postId: string, limit: number = 10, lastCommentId?: string) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: postId },
      take: limit,
      skip: lastCommentId ? 1 : 0,
      cursor: lastCommentId ? { id: lastCommentId } : undefined,
      orderBy: {
        createdAt: "asc", // Oldest comments first for chronological display
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
      },
    });
    return comments;
  } catch (error) {
    console.error("Error fetching comments for post:", error);
    throw error;
  }
};