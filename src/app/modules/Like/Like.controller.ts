import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { LikeServices } from './Like.service';


/**
 * Controller functions for handling Like-related API requests.
 */

const createLike = catchAsync(async (req, res) => {
  // Assuming req.user contains the authenticated user's ID
  const { userId } = req.user; // Get userId from the authenticated user
  const { postId } = req.body; // Get postId from the request body

  const result = await LikeServices.createLikeIntoDB(userId, postId);

  if (result === null) {
    // If result is null, it means the user already liked this post
    sendResponse(res, {
      statusCode: httpStatus.CONFLICT, // 409 Conflict indicates a conflict with the current state of the resource
      message: 'You have already liked this post',
      data: null,
    });
    return;
  }

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Post liked successfully',
    data: result,
  });
});

const deleteLike = catchAsync(async (req, res) => {
  // Assuming req.user contains the authenticated user's ID
  const { userId } = req.user; // Get userId from the authenticated user
  const { postId } = req.body; // Get postId from the request body to unlike

  const result = await LikeServices.deleteLikeFromDB(userId, postId);

  if (result === null) {
    // If result is null, it means the like was not found
    sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND, // 404 Not Found if the like to delete doesn't exist
      message: 'Like not found or already removed',
      data: null,
    });
    return;
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Post unliked successfully',
    data: result,
  });
});

const getLikesForPost = catchAsync(async (req, res) => {
  const { postId } = req.params; // Get postId from URL parameters

  const result = await LikeServices.getLikesForPostFromDB(postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Likes for post retrieved successfully',
    data: result,
  });
});

const getLikesByUser = catchAsync(async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed as a URL parameter

  const result = await LikeServices.getLikesByUserFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Likes by user retrieved successfully',
    data: result,
  });
});

const countLikes = catchAsync(async (req, res) => {
  const { postId } = req.params; // Get postId from URL parameters

  const result = await LikeServices.countLikesForPost(postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Like count retrieved successfully',
    data: { count: result }, // Wrap count in an object for consistent response format
  });
});


export const LikeControllers = {
  createLike,
  deleteLike,
  getLikesForPost,
  getLikesByUser,
  countLikes,
};
