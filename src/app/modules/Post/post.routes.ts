import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PostControllers } from './post.controller';


const router = express.Router();

router.post(
  '/',
  // (req,res)=>{console.log(req.headers.authorization) },
  auth(), // Apply authentication middleware
  // If you have a specific validation for creating a post, uncomment and use it here:
  // validateRequest(PostValidations.createPostValidation),
  PostControllers.createPost,
);

router.get(
  '/',
  auth(), // Apply authentication middleware
  PostControllers.getAllPosts
);

router.get(
  '/:id', // Route for getting a single post by ID
  auth(), // Apply authentication middleware
  PostControllers.getSinglePost
);


router.put(
  '/:id',
  auth(), // Apply authentication middleware
  PostControllers.updatePost,
);

router.delete(
  '/:id',
  auth(), // Apply authentication middleware
  PostControllers.deletePost,
);


export const PostRouters = router;
