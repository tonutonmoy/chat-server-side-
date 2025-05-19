import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserControllers } from './user.controller';
import { UserValidations } from './user.validation';
const router = express.Router();

router.post(
  '/register',
  validateRequest(UserValidations.registerUser),
  UserControllers.registerUser,
);

router.post(
  '/resend-verification-email',
  UserControllers.resendUserVerificationEmail,
);

router.get('/', UserControllers.getAllUsers);

router.get('/me', UserControllers.getMyProfile);

router.get('/:id', UserControllers.getUserDetails);
router.put(
  '/update-profile/:id',
  
  UserControllers.updateMyProfile,
);
router.get('/verify-email/:token', UserControllers.verifyUserEmail);

router.put(
  '/update-user/:id',
  auth('ADMIN'),
  UserControllers.updateUserRoleStatus,
);

router.post(
  '/change-password',
  auth('USER', 'ADMIN'),
  UserControllers.changePassword,
);

export const UserRouters = router;
