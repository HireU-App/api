import express from 'express';
import prisma from '../tools/prisma.js';
import { RequestError } from '../constants/commonErrors.js';
import _ from 'lodash';

const router = express.Router();

router.get('/:id', async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: request.params.id,
      },
    });
    if (!user) {
      throw new RequestError(`User not found with ID${request.params.id}`);
    }
    const userAttributes = _.pick(user, [
      'name',
      'email',
      'createdAt',
      'updatedAt',
    ]);
    response.json({ userAttributes });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: request.params.id,
      },
    });
    if (!user) {
      throw new RequestError(`User not found with ID${request.params.id}`);
    }
    const bodyData = _.pick(request.body, ['name', 'email']);
    if (_.has(bodyData, 'name')) {
      await prisma.user.update({
        where: {
          id: request.params.id,
        },
        data: {
          name: request.body.name,
        },
      });
      response.json({
        message: `Successfully updated user name to ${request.body.name}`,
      });
    } else if (_.has(bodyData, 'email')) {
      await prisma.user.update({
        where: {
          id: request.params.id,
        },
        data: {
          email: request.body.email,
        },
      });
      response.json({
        message: `Successfully updated user Email to ${request.body.email}`,
      });
    } else {
      throw new RequestError(
        'Invalid fields provided; Can not update this field'
      );
    }
  } catch (error) {
    next(error);
    return;
  }
});

router.delete('/:id', async (request, response, next) => {
  try {
    const testUser = await prisma.user.findUnique({
      where: {
        id: request.params.id,
      },
    });
    if (!testUser) {
      throw new RequestError(`User not found with ID${request.params.id}`);
    }
    const username = testUser.name;

    await prisma.user.delete({
      where: {
        id: request.params.id,
      },
    });
    response.json({
      message: `Deletion of user: ${username} successful`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
