import { User, Post, Comment, Like } from '@prisma/client'; // Prisma client generated types
import prisma from '../../utils/prisma';
import { IPost } from './post.interface'; // Assuming IPost interface is defined here

/**
 * Service functions for managing Post-related operations.
 */

/**
 * Creates a new post in the database.
 * @param payload The data for the new post, conforming to IPost interface.
 * @returns The newly created post.
 */
export const createPostIntoDB = async (payload: any) => {
  // Ensure the payload matches the Post schema, especially for authorId
  // For simplicity, directly using payload assuming it contains authorId
  const result = await prisma.post.create({
    data:payload,
  });
  return result;
};

/**
 * Retrieves all posts from the database.
 * Optionally filters posts by a specific user ID.
 * Includes related author, comments, and likes for each post.
 * @param userId (Optional) The ID of the author to filter posts by.
 * @returns An array of posts.
 */
export const getAllPostsFromDB = async (userId?: string) => {
  const whereCondition = userId ? { authorId: userId } : {};

  const result = await prisma.post.findMany({
    where: whereCondition,
    include: {
      author: true,   // Include the user who authored the post
      comments: {     // Include all comments for the post
        include: {
          author: true // Include the user who made the comment
        }
      },
      likes: {        // Include all likes for the post
        include: {
          author: true // Include the user who liked the post
        }
      },
    },
    orderBy: {
      createdAt: 'desc', // Order posts by creation date, newest first
    },
  });
  return result;
};

/**
 * Retrieves a single post by its ID from the database.
 * Includes related author, comments, and likes.
 * @param postId The ID of the post to retrieve.
 * @returns The post if found, otherwise null.
 */
export const getSinglePostFromDB = async (postId: string) => {
  const result = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    include: {
      author: true,
      comments: {
        include: {
          author: true
        }
      },
      likes: {
        include: {
          author: true
        }
      },
    },
  });
  return result;
};

/**
 * Updates an existing post in the database.
 * @param postId The ID of the post to update.
 * @param payload Partial data to update the post with.
 * @returns The updated post.
 */
export const updatePostIntoDB = async (postId: string, payload: any) => {
  const result = await prisma.post.update({
    where: { id: postId },
    data: payload,
  });
  return result;
};

/**
 * Deletes a post from the database.
 * @param postId The ID of the post to delete.
 * @returns The deleted post.
 */
export const deletePostFromDB = async (postId: string) => {
  // When deleting a post, you might also want to delete
  // associated comments and likes to maintain data integrity.
  // Prisma usually handles cascading deletes if configured in the schema,
  // but explicit deletion can be done here if needed.

  // Example of explicit deletion (if not handled by Prisma cascade)
  // await prisma.comment.deleteMany({ where: { postId: postId } });
  // await prisma.like.deleteMany({ where: { postId: postId } });

  const result = await prisma.post.delete({
    where: { id: postId },
  });
  return result;
};


// Export all Post service functions
export const PostServices = {
  createPostIntoDB,
  getAllPostsFromDB,
  getSinglePostFromDB,
  updatePostIntoDB,
  deletePostFromDB,
};
