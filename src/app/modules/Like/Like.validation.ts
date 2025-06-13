import z from 'zod';

/**
 * Zod validation schema for creating a new post.
 * This ensures the request body for post creation adheres to the expected structure
 * based on the IPost interface.
 */
const createPostValidation = z.object({
  body: z.object({
    // Title is a required string for a post
    title: z.string({
      required_error: 'Title is required!',
      invalid_type_error: 'Title must be a string',
    }),
    // Content is optional and can be a string or null
    content: z.string({
      invalid_type_error: 'Content must be a string or null',
    }).optional().nullable(), // .optional() for undefined, .nullable() for null

    // imageUrl is optional and can be a string or null
    imageUrl: z.string({
      invalid_type_error: 'Image URL must be a string or null',
    }).url('Invalid URL format for image').optional().nullable(), // .url() to validate if it's a valid URL

    // authorId is typically derived from the authenticated user on the backend
    // and should not be provided directly by the client in the request body for creation.
    // If you intend for the client to send it, uncomment the following and adjust as needed:
    // authorId: z.string({
    //   required_error: 'Author ID is required!',
    //   invalid_type_error: 'Author ID must be a string',
    // }).refine(id => id.length > 0, { message: "Author ID cannot be empty" }),
  }),
});

/**
 * Zod validation schema for updating an existing post.
 * Allows partial updates to the post fields.
 */
const updatePostValidation = z.object({
  body: z.object({
    title: z.string({
      invalid_type_error: 'Title must be a string',
    }).optional(),
    content: z.string({
      invalid_type_error: 'Content must be a string or null',
    }).optional().nullable(),
    imageUrl: z.string({
      invalid_type_error: 'Image URL must be a string or null',
    }).url('Invalid URL format for image').optional().nullable(),
  }).partial(), // .partial() makes all fields within the body optional for updates
});

/**
 * Exports all post-related validation schemas.
 */
export const PostValidations = {
  createPostValidation,
  updatePostValidation,
};
