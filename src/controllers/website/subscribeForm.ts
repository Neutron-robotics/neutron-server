import Joi from 'joi';
import { RequestHandler, Request } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import Newsletter from '../../models/Newsletter';
import User, { UserRole } from '../../models/User';
import sendEmail from '../../utils/nodemailer/sendEmail';

interface SubscribeContactFormBody {
    email: string,
    firstname: string,
    lastname: string,
    phone: string,
    message: string
}

const subscribeContactFormSchemaBody = Joi.object<SubscribeContactFormBody>().keys({
  email: Joi.string().email().required(),
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  phone: Joi.string().required(),
  message: Joi.string().required()
});

const subscribeContactForm: RequestHandler<any> = async (req: Request<{}, {}, SubscribeContactFormBody>, res, next) => {
  const { body } = req;

  try {
    if (!Newsletter.exists({ email: body.email })) {
      await Newsletter.create({
        email: body.email
      });
    }

    const adminUsers = await User.find({ role: UserRole.Admin });

    adminUsers.forEach(admin => sendEmail({
      to: admin.email,
      subject: `${body.firstname} sent a message!`,
      template: 'contactForm',
      templateArgs: {
        '{{CONTACT_FORM_FIRSTNAME}}': body.firstname,
        '{{CONTACT_FORM_LASTNAME}}': body.lastname,
        '{{CONTACT_FORM_EMAIL}}': body.email,
        '{{CONTACT_FORM_PHONE}}': body.phone,
        '{{CONTACT_FORM_MESSAGE}}': body.message
      }
    }));

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default requestMiddleware(
  subscribeContactForm,
  { validation: { body: subscribeContactFormSchemaBody } }
);
