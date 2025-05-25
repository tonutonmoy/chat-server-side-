// src/modules/Post/post.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CreatePostData {
  content: string;
  mediaUrl?: string;   // Changed from imageUrl
  mediaType?: string;  // New field
  authorId: string;
}

/**
 * Creates a new post.
 * @param data - The post data including content, optional mediaUrl, mediaType, and authorId.
 * @returns The created post object.
 */
export const createPost = async (data: CreatePostData) => {
  const { content, mediaUrl, mediaType, authorId } = data; // Destructure new fields
  try {
    const post = await prisma.post.create({
      data: {
        content,
        mediaUrl,   // Use mediaUrl
        mediaType,  // Use mediaType
        author: {
          connect: { id: authorId },
        },
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
    return post;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

/**
 * Fetches a list of posts, with optional pagination.
 * @param lastPostId - Optional. The ID of the last post fetched for infinite scrolling.
 * @param limit - Optional. The number of posts to fetch (default: 10).
 * @returns An array of post objects.
 */
export const getPosts = async (lastPostId?: string, limit: number = 10) => {
  try {
    const posts = await prisma.post.findMany({
      take: limit,
      skip: lastPostId ? 1 : 0, // Skip 1 if lastPostId is provided (for cursor-based pagination)
      cursor: lastPostId ? { id: lastPostId } : undefined,
      orderBy: {
        createdAt: "desc", // Latest posts first
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        likes: { // Include likes to check if current user liked it
          select: { userId: true },
        },
        comments: { // Include a few comments or just count
          take: 2, // Example: get last 2 comments
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, firstName: true } },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
};

/**
 * Fetches a single post by its ID.
 * @param postId The ID of the post.
 * @returns The post object or null if not found.
 */
export const getPostById = async (postId: string) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
        _count: { select: { likes: true, comments: true } },
      }
    });
    return post;
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    throw error;
  }
};