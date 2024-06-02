import { randomUUID } from 'crypto';
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import Token, { TokenCategory } from '../../models/Token';
import { BadRequest } from '../../errors/bad-request';
import sendEmail from '../../utils/nodemailer/sendEmail';

const registerSchema = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().required().email(),
  registrationKey: Joi.string().required()
});

interface RegisterBody {
    firstName: string,
    lastName: string,
    password: string,
    email: string,
    registrationKey: string
}

const register: RequestHandler = async (req: Request<{}, {}, RegisterBody>, res, next) => {
  const { body } = req;
  try {
    const registrationToken = await Token.findOne({ key: body.registrationKey, category: TokenCategory.AccountCreation });
    if (!registrationToken) throw new BadRequest('No token found');

    if (!registrationToken.consume()) throw new BadRequest('Token has expired');

    const activationKey = randomUUID();

    const user = new User({
      ...body,
      active: true,
      activationKey
    });

    await user.save();

    const invitationUrl = new URL(`/verify/${user.activationKey}`, process.env.WEB_APPLICATION_URI);

    sendEmail({
      to: user.email,
      subject: 'Verify your email',
      template: 'verify',
      templateArgs: {
        '{{NEUTRON_VERIFY_LINK}}': invitationUrl.href
      }
    });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(User.checkDuplicateEmailError(error));
  }
};

export default requestMiddleware(register, { validation: { body: registerSchema } });
