import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PostServices } from './post.service'; // Corrected service import
// Assuming config, jwtHelpers, and prisma imports are still relevant for your project structure
// import config from '../../../config';
// import { jwtHelpers } from '../../errors/helpers/jwtHelpers';
// import prisma from '../../utils/prisma';

/**
 * Controller functions for handling Post-related API requests.
 */

const createPost = catchAsync(async (req, res) => {
  // Assuming req.user contains the authenticated user's ID
  // and the frontend sends the rest of the post data in req.body
  const { userId } = req.user; // Get userId from the authenticated user

   const postData:any=req.body
  // Combine the post data from req.body with the authorId
  // Ensure your IPost interface correctly reflects title, content, imageUrl, and authorId
      postData.authorId=userId

  const result = await PostServices.createPostIntoDB(postData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Post created successfully',
    data: result,
  });
});

const getAllPosts = catchAsync(async (req, res) => {
  // You might want to get all posts, or filter by a specific user if needed
  // For now, it fetches all posts. If filtering by authenticated user, pass userId:
  // const { userId } = req.user;
  const result = await PostServices.getAllPostsFromDB(); // Or pass userId if you want posts only by the current user

  sendResponse(res, {
    statusCode: httpStatus.OK, // Changed to OK for successful retrieval
    message: 'Posts retrieved successfully',
    data: result,
  });
});

const getSinglePost = catchAsync(async (req, res) => {
  const result = await PostServices.getSinglePostFromDB(req.params.id);

  if (!result) {
    // If no post is found, send a 404 Not Found response
    sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      message: 'Post not found',
      data: null,
    });
    return;
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Post retrieved successfully',
    data: result,
  });
});

const updatePost = catchAsync(async (req, res) => {
  const result = await PostServices.updatePostIntoDB(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Post updated successfully',
    data: result,
  });
});

const deletePost = catchAsync(async (req, res) => {
  const result = await PostServices.deletePostFromDB(req?.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Post deleted successfully',
    data: result,
  });
});


export const PostControllers = {
  createPost,
  getAllPosts,
  getSinglePost, // Added for retrieving a single post
  updatePost,
  deletePost,
};
