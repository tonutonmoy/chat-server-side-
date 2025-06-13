import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CommentServices } from './Comment.service';
// import validateRequest from '../../middlewares/validateRequest';
// import { CommentValidations } from './comment.validation';

/**
 * Controller functions for handling Comment-related API requests.
 */

const createComment = catchAsync(async (req, res) => {
  // Assuming req.user contains the authenticated user's ID
  const { userId } = req.user; // Get userId from the authenticated user
  const { postId, content } = req.body; // Get postId and content from the request body

  const result = await CommentServices.createCommentIntoDB({
    content,
    authorId: userId,
    postId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Comment created successfully',
    data: result,
  });
});

const getAllComments = catchAsync(async (req, res) => {
  const result = await CommentServices.getAllCommentsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Comments retrieved successfully',
    data: result,
  });
});

const getSingleComment = catchAsync(async (req, res) => {
  const { id } = req.params; // Get commentId from URL parameters

  const result = await CommentServices.getSingleCommentFromDB(id);

  if (!result) {
    sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      message: 'Comment not found',
      data: null,
    });
    return;
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Comment retrieved successfully',
    data: result,
  });
});

const getCommentsForPost = catchAsync(async (req, res) => {
  const { postId } = req.params; // Get postId from URL parameters

  const result = await CommentServices.getCommentsForPostFromDB(postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Comments for post retrieved successfully',
    data: result,
  });
});

const getCommentsByUser = catchAsync(async (req, res) => {
  const { userId } = req.params; // Get userId from URL parameters

  const result = await CommentServices.getCommentsByUserFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Comments by user retrieved successfully',
    data: result,
  });
});


const updateComment = catchAsync(async (req, res) => {
  const { id } = req.params; // Get commentId from URL parameters
  const payload = req.body; // Expecting { content: string }

  const result = await CommentServices.updateCommentIntoDB(id, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Comment updated successfully',
    data: result,
  });
});

const deleteComment = catchAsync(async (req, res) => {
  const { id } = req.params; // Get commentId from URL parameters

  const result = await CommentServices.deleteCommentFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Comment deleted successfully',
    data: result,
  });
});


export const CommentControllers = {
  createComment,
  getAllComments,
  getSingleComment,
  getCommentsForPost,
  getCommentsByUser,
  updateComment,
  deleteComment,
};
