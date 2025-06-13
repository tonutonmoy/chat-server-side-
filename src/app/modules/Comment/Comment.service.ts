import { Comment, User, Post } from '@prisma/client'; // Prisma client generated types
import prisma from '../../utils/prisma'; // Assuming your Prisma client instance

/**
 * Service functions for managing Comment-related operations.
 */

/**
 * Creates a new comment in the database.
 * @param payload The data for the new comment, including authorId and postId.
 * @returns The newly created comment.
 */
export const createCommentIntoDB = async (payload: { content: string, authorId: string, postId: string }) => {
  const result = await prisma.comment.create({
    data: {
      content: payload.content,
      authorId: payload.authorId,
      postId: payload.postId,
    },
  });
  return result;
};

/**
 * Retrieves all comments from the database.
 * @returns An array of comments.
 */
export const getAllCommentsFromDB = async () => {
  const result = await prisma.comment.findMany({
    include: {
      author: true, // Include the user who made the comment
      post: true,   // Include the post to which the comment belongs
    },
    orderBy: {
      createdAt: 'desc', // Order comments by creation date, newest first
    },
  });
  return result;
};

/**
 * Retrieves a single comment by its ID from the database.
 * @param commentId The ID of the comment to retrieve.
 * @returns The comment if found, otherwise null.
 */
export const getSingleCommentFromDB = async (commentId: string) => {
  const result = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      author: true,
      post: true,
    },
  });
  return result;
};

/**
 * Retrieves all comments for a specific post.
 * @param postId The ID of the post to get comments for.
 * @returns An array of comments associated with the post.
 */
export const getCommentsForPostFromDB = async (postId: string) => {
  const result = await prisma.comment.findMany({
    where: {
      postId: postId,
    },
    include: {
      author: true,
    },
    orderBy: {
      createdAt: 'asc', // Order comments by creation date, oldest first for chronological display
    },
  });
  return result;
};

/**
 * Retrieves all comments made by a specific user.
 * @param authorId The ID of the user whose comments are to be retrieved.
 * @returns An array of comments made by the user.
 */
export const getCommentsByUserFromDB = async (authorId: string) => {
  const result = await prisma.comment.findMany({
    where: {
      authorId: authorId,
    },
    include: {
      post: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return result;
};

/**
 * Updates an existing comment in the database.
 * @param commentId The ID of the comment to update.
 * @param payload Partial data to update the comment with (e.g., { content: string }).
 * @returns The updated comment.
 */
export const updateCommentIntoDB = async (commentId: string, payload: { content?: string }) => {
  const result = await prisma.comment.update({
    where: { id: commentId },
    data: payload,
  });
  return result;
};

/**
 * Deletes a comment from the database.
 * @param commentId The ID of the comment to delete.
 * @returns The deleted comment.
 */
export const deleteCommentFromDB = async (commentId: string) => {
  const result = await prisma.comment.delete({
    where: { id: commentId },
  });
  return result;
};

// Export all Comment service functions following the desired pattern
export const CommentServices = {
  createCommentIntoDB,
  getAllCommentsFromDB,
  getSingleCommentFromDB,
  getCommentsForPostFromDB,
  getCommentsByUserFromDB,
  updateCommentIntoDB,
  deleteCommentFromDB,
};
