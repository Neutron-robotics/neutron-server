import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import moment from 'moment';
import path from 'path';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import User, { UserRole } from '../../models/User';
import { NotFound } from '../../errors/bad-request';
import Token, { TokenCategory } from '../../models/Token';
import sendEmail from '../../utils/nodemailer/sendEmail';
import ApplicationError from '../../errors/application-error';

const inviteUserSchemaBody = Joi.object().keys({
  email: Joi.string().required()
});

interface InviteUserBody {
  email: string
}

const inviteUser: RequestHandler<any> = async (
  req: Request<{}, {}, InviteUserBody>,
  res,
  next
) => {
  const { body } = req;

  try {
    if (!process.env.BASE_URI) throw new ApplicationError('The base URI is not defined');

    const token = await Token.create({
      expirationDate: moment().add(14, 'days').toDate(),
      category: TokenCategory.AccountCreation
    });

    const invitationUrl = new URL(`/register/${token.key}`, process.env.BASE_URI);

    sendEmail({
      subject: 'Register to Neutron',
      to: body.email,
      template: 'register',
      templateArgs: {
        '{{NEUTRON_CREATE_ACCOUNT_LINK}}': invitationUrl.href
      }
    });

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  inviteUser,
  { validation: { body: inviteUserSchemaBody } }
), { roles: [UserRole.Admin] });
