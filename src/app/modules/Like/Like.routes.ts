import express from 'express';
import auth from '../../middlewares/auth'; // Assuming your authentication middleware
import { LikeControllers } from './Like.controller';

// If you have validation schemas for likes, you would import them here, e.g.:
// import validateRequest from '../../middlewares/validateRequest';
// import { LikeValidations } from './like.validation';

const router = express.Router();

/**
 * Route to create a new like (like a post).
 * Requires authentication.
 * Expected body: { postId: string }
 */
router.post(
  '/',
  auth(), // Authenticate the user
  // If you have validation for the like payload (e.g., postId is a string), uncomment and use it:
  // validateRequest(LikeValidations.createLike),
  LikeControllers.createLike,
);

/**
 * Route to delete a like (unlike a post).
 * Requires authentication.
 * Expected body: { postId: string }
 */
router.delete(
  '/',
  auth(), // Authenticate the user
  // If you have validation for the unlike payload, uncomment and use it:
  // validateRequest(LikeValidations.deleteLike),
  LikeControllers.deleteLike,
);

/**
 * Route to get all likes for a specific post.
 * No authentication might be required if likes are public.
 * URL parameter: postId
 */
router.get(
  '/posts/:postId', // Example: /api/v1/likes/posts/:postId
  // auth(), // Uncomment if authentication is required to view likes
  LikeControllers.getLikesForPost,
);

/**
 * Route to get all posts liked by a specific user.
 * No authentication might be required if liked posts are public.
 * URL parameter: userId
 */
router.get(
  '/users/:userId', // Example: /api/v1/likes/users/:userId
  // auth(), // Uncomment if authentication is required to view user's likes
  LikeControllers.getLikesByUser,
);

/**
 * Route to get the count of likes for a specific post.
 * No authentication might be required as it's just a count.
 * URL parameter: postId
 */
router.get(
  '/count/:postId', // Example: /api/v1/likes/count/:postId
  LikeControllers.countLikes,
);

export const LikeRouters = router;
