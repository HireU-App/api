import express from 'express';
import bcrypt from 'bcrypt';
import Prisma from '../tools/prisma.js';
import validator from 'validator';
import { RequestError } from '../constants/commonErrors.js';
import tokenService from '../services/tokenService.js';

const router = express.Router();

router.post('/signup', async (request, response, next) => {
  try {
    const userEmail = request.body.email;
    if (!userEmail || !userEmail.trim() || !validator.isEmail(userEmail)) {
      throw new RequestError('Must provide a valid email');
    }
    if (!request.body.name) {
      throw new RequestError('Must provide a valid name');
    }
    const userPassword = request.body.password;
    if (!userPassword || !userPassword.trim()) {
      throw new RequestError('Must provide a valid password');
    }

    const user = await Prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (user) {
      throw new RequestError('An account with that email already exists');
    }

    const passwordHash = await bcrypt.hash(userPassword, 10);

    const newUser = await Prisma.user.create({
      data: {
        name: request.body.name,
        email: userEmail,
        password: passwordHash,
      },
    });

    response.json({
      message: 'Created user in database!',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/signin', async (request, response, next) => {
  try {
    const userEmail = request.body.email;
    const userPassword = request.body.password;

    if (!userEmail || !validator.isEmail(userEmail)) {
      throw new RequestError('Must provide a valid email');
    }
    if (!userPassword || !userPassword.trim()) {
      throw new RequestError('Must provide a valid password');
    }

    const user = await Prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });
    const passwordMatch = await bcrypt.compare(userPassword, user.password);
    if (!user && !passwordMatch) {
      throw new RequestError('Invalid email or password');
    }

    const accessToken = await tokenService.createAccessToken(user);
    const refreshToken = await tokenService.getSignedRefreshToken({
      request,
      user,
    });

    response.json({
      message: 'Successfully signed in!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
