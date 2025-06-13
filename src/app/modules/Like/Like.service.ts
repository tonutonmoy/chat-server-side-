import { Like, User, Post } from '@prisma/client'; // Prisma client generated types
import prisma from '../../utils/prisma'; // Assuming your Prisma client instance

/**
 * Service functions for managing Like-related operations.
 */

/**
 * Creates a new like in the database.
 * This function ensures that a user can only like a specific post once
 * by leveraging the unique constraint on [authorId, postId].
 *
 * @param authorId The ID of the user who is liking the post.
 * @param postId The ID of the post being liked.
 * @returns The newly created like object, or null if the like already exists.
 */
export const createLikeIntoDB = async (authorId: string, postId: string) => {
  try {
    const result = await prisma.like.create({
      data: {
        authorId: authorId,
        postId: postId,
      },
    });
    return result;
  } catch (error: any) {
    // Handle unique constraint violation (user already liked this post)
    if (error.code === 'P2002') { // Prisma error code for unique constraint violation
      console.warn(`User ${authorId} has already liked post ${postId}.`);
      return null; // Or throw a specific error, depending on desired behavior
    }
    throw error; // Re-throw other errors
  }
};

/**
 * Deletes a like from the database.
 * This effectively "unlikes" a post by a specific user.
 *
 * @param authorId The ID of the user who is unliking the post.
 * @param postId The ID of the post being unliked.
 * @returns The deleted like object, or null if no like was found to delete.
 */
export const deleteLikeFromDB = async (authorId: string, postId: string) => {
  try {
    const result = await prisma.like.delete({
      where: {
        authorId_postId: { // Use the unique compound index defined in the schema
          authorId: authorId,
          postId: postId,
        },
      },
    });
    return result;
  } catch (error: any) {
    // Handle "record not found" error if the like doesn't exist
    if (error.code === 'P2025') { // Prisma error code for record not found
      console.warn(`Like by user ${authorId} on post ${postId} not found for deletion.`);
      return null;
    }
    throw error;
  }
};

/**
 * Retrieves all likes for a specific post.
 *
 * @param postId The ID of the post to get likes for.
 * @returns An array of like objects associated with the post.
 */
export const getLikesForPostFromDB = async (postId: string) => {
  const result = await prisma.like.findMany({
    where: {
      postId: postId,
    },
    include: {
      author: true, // Include the user who made the like
    },
  });
  return result;
};

/**
 * Retrieves all likes made by a specific user.
 *
 * @param authorId The ID of the user whose likes are to be retrieved.
 * @returns An array of like objects made by the user.
 */
export const getLikesByUserFromDB = async (authorId: string) => {
  const result = await prisma.like.findMany({
    where: {
      authorId: authorId,
    },
    include: {
      post: true, // Include the post that was liked
    },
  });
  return result;
};

/**
 * Counts the total number of likes for a specific post.
 *
 * @param postId The ID of the post to count likes for.
 * @returns The number of likes for the specified post.
 */
export const countLikesForPost = async (postId: string) => {
  const count = await prisma.like.count({
    where: {
      postId: postId,
    },
  });
  return count;
};

// Export all Like service functions following the desired pattern
export const LikeServices = {
  createLikeIntoDB,
  deleteLikeFromDB,
  getLikesForPostFromDB,
  getLikesByUserFromDB,
  countLikesForPost,
};
