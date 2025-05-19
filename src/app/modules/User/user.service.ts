import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import httpStatus from 'http-status';
import config from '../../../config';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { verification } from '../../errors/helpers/generateEmailVerificationLink';
import prisma from '../../utils/prisma';
import Email from '../../utils/sendMail';
import {
  failedEmailVerificationHTML,
  successEmailVerificationHTML,
} from './user.constant';

interface UserWithOptionalPassword extends Omit<User, 'password'> {
  password?: string;
}

const registerUserIntoDB = async (payload: User) => {
  const hashedPassword: string = await bcrypt.hash(payload.password, 12);
  const userData = {
    ...payload,
    password: hashedPassword,
  };
  const newUser = await prisma.user.create({
    data: {
      ...userData,
    },
  });

  // await resendUserVerificationEmail(newUser.email);
  const userWithOptionalPassword = newUser as UserWithOptionalPassword;
  delete userWithOptionalPassword.password;

  return userWithOptionalPassword;
};

const getAllUsersFromDB = async (query: any) => {
  const usersQuery = new QueryBuilder(prisma.user, query);
   
  const result = await usersQuery
    .search(['firstName', 'lastName', 'email'])
    .filter()
    .sort()
    .paginate()
    .execute();
  const pagination = await usersQuery.countTotal();

  return {
    meta: pagination,
    result,
  };
};

const getMyProfileFromDB = async (id: string) => {
  const Profile = await prisma.user.findUniqueOrThrow({
    where: {
      id: id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      profileImage:true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Profile;
};

const getUserDetailsFromDB = async (id: string) => {

 
  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    profileImage:true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
};

const updateMyProfileIntoDB = async (id: string, payload: Partial<User>) => {

  console.log(payload)
    const userData = await prisma.user.update({
      where: { id },
      data: payload,
    });

    return userData;
 
};
  // Fetch and return the updated user including the profile


const updateUserRoleStatusIntoDB = async (id: string, payload: any) => {
  const result = await prisma.user.update({
    where: {
      id: id,
    },
    data: payload,
  });
  return result;
};

const changePassword = async (user: any, payload: any) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
      status: 'ACTIVE',
    },
  });

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.oldPassword,
    userData.password,
  );

  if (!isCorrectPassword) {
    throw new Error('Password incorrect!');
  }

  const hashedPassword: string = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'Password changed successfully!',
  };
};

const resendUserVerificationEmail = async (email: string) => {
  const [emailVerificationLink, hashedToken] =
    verification.generateEmailVerificationLink();

  const user = await prisma.user.update({
    where: { email: email },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: new Date(Date.now() + 3600 * 1000),
    },
  });

  const emailSender = new Email(user);
  await emailSender.sendEmailVerificationLink(
    'Email verification link',
    emailVerificationLink,
  );
  return user;
};

const verifyUserEmail = async (res: Response, token: string) => {
  const hashedToken = verification.generateHashedToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
    },
  });

  if (!user) {
    // throw new AppError(
    //   httpStatus.BAD_REQUEST,
    //   'Invalid email verification token.',
    // );

    res.send(failedEmailVerificationHTML(config.base_url_client as string));
    return;
  }

  if (
    user &&
    user.emailVerificationTokenExpires &&
    user.emailVerificationTokenExpires < new Date(Date.now())
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Email verification token has expired. Please try resending the verification email again.',
    );
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    },
  });

  if (updatedUser.isEmailVerified) {
    res.send(successEmailVerificationHTML());
    return updatedUser;
  }

  return updatedUser;
};

export const UserServices = {
  registerUserIntoDB,
  getAllUsersFromDB,
  getMyProfileFromDB,
  getUserDetailsFromDB,
  updateMyProfileIntoDB,
  updateUserRoleStatusIntoDB,
  changePassword,
  resendUserVerificationEmail,
  verifyUserEmail,
};
