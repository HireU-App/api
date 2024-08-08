import express from 'express';
import bcrypt from 'bcrypt';
import Prisma from '../tools/prisma.js';
import validator from 'validator';
import { RequestError } from '../constants/commonErrors.js';
import jwt from '../tools/jwt.js';
import prisma from '../tools/prisma.js';
import { sendEmail } from '../services/emailService.js';

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

    // respond with a success message
    response.json({
      message: 'Created user in database!',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', async (request, response, next) => {
  try {
    if (
      !request.body.email.trim() ||
      !validator.isEmail(request.body.email.trim())
    ) {
      throw new RequestError('invalid email');
    }

    const user = await prisma.user.findUnique({
      where: {
        email: request.body.email,
      },
    });

    if (user) {
      //create jwt with payload of email
      const resetToken = jwt.sign(
        {
          email: user.email,
          type: 'resetJWT',
        },
        '1h'
      );
      //create message to send to user email
      const message = `Hello ${user.name},\n\nPlease click the link below to reset your password:\n\nhttps://app.hireu.tech/reset-password?token=${resetToken}\n\nIf you didn't expect this email, please contact us at security@hireu.tech`;
      //send user an email
      sendEmail({
        to: user.email,
        subject: 'Reset Password',
        text: message,
      });
    }
    response.json({
      message:
        'If email registered with system, reset password link was successfully sent',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async (request, response, next) => {
  const resetJWT = request.body.token;
  try {
    const jwtData = await jwt.verify(resetJWT);
    if (!jwtData) {
      throw new RequestError('Invalid JWT');
    }
    const newPassword = request.body.password;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await Prisma.user.update({
      where: {
        email: jwtData.email,
      },
      data: {
        password: passwordHash,
      },
    });
    response.json({
      message: 'Successfully updated user password',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
