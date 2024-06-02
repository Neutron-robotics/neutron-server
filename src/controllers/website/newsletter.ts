import Joi from 'joi';
import { RequestHandler, Request } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import Newsletter from '../../models/Newsletter';
import { BadRequest } from '../../errors/bad-request';

interface SubscribeNewsletterBody {
    email: string,
}

const subscribeNewsletterSchemaBody = Joi.object<SubscribeNewsletterBody>().keys({
  email: Joi.string().email().required()
});

const subscribeNewsletter: RequestHandler<any> = async (req: Request<{}, {}, SubscribeNewsletterBody>, res, next) => {
  const { body } = req;

  try {
    if (await Newsletter.exists({ email: body.email })) throw new BadRequest();

    await Newsletter.create({
      email: body.email
    });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default requestMiddleware(
  subscribeNewsletter,
  { validation: { body: subscribeNewsletterSchemaBody } }
);
