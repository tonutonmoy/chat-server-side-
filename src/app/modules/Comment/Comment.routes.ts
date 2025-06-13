import express from 'express';
import auth from '../../middlewares/auth'; // Assuming your authentication middleware
import { CommentControllers } from './Comment.controller';

// If you have validation schemas for comments, you would import them here, e.g.:
// import validateRequest from '../../middlewares/validateRequest';
// import { CommentValidations } from './comment.validation';

const router = express.Router();

/**
 * Route to create a new comment.
 * Requires authentication.
 * Expected body: { postId: string, content: string }
 */
router.post(
  '/',
  auth(), // Authenticate the user
  // If you have validation for the comment payload, uncomment and use it:
  // validateRequest(CommentValidations.createComment),
  CommentControllers.createComment,
);

/**
 * Route to get all comments.
 * No authentication might be required if comments are public.
 */
router.get(
  '/',
  // auth(), // Uncomment if authentication is required to view all comments
  CommentControllers.getAllComments,
);

/**
 * Route to get a single comment by its ID.
 * No authentication might be required if comments are public.
 * URL parameter: id (comment ID)
 */
router.get(
  '/:id', // Example: /api/v1/comments/:id
  // auth(), // Uncomment if authentication is required to view a single comment
  CommentControllers.getSingleComment,
);

/**
 * Route to get all comments for a specific post.
 * No authentication might be required if comments are public.
 * URL parameter: postId
 */
router.get(
  '/post/:postId', // Example: /api/v1/comments/post/:postId
  // auth(), // Uncomment if authentication is required to view comments for a post
  CommentControllers.getCommentsForPost,
);

/**
 * Route to get all comments made by a specific user.
 * No authentication might be required if comments are public.
 * URL parameter: userId
 */
router.get(
  '/user/:userId', // Example: /api/v1/comments/user/:userId
  // auth(), // Uncomment if authentication is required to view user's comments
  CommentControllers.getCommentsByUser,
);

/**
 * Route to update an existing comment.
 * Requires authentication.
 * URL parameter: id (comment ID)
 * Expected body: { content?: string }
 */
router.put(
  '/:id',
  auth(), // Authenticate the user
  // If you have validation for the update payload, uncomment and use it:
  // validateRequest(CommentValidations.updateComment),
  CommentControllers.updateComment,
);

/**
 * Route to delete a comment.
 * Requires authentication.
 * URL parameter: id (comment ID)
 */
router.delete(
  '/:id',
  auth(), // Authenticate the user
  CommentControllers.deleteComment,
);

// Export the main router object containing all comment-related routes
export const CommentRouters = router;
