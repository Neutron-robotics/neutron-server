import { Request, RequestHandler } from 'express';
import { sign } from 'jsonwebtoken';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';

const refresh: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  const { user } = req as any;
  const tokenPayload = { sub: user.sub, role: user.role };

  try {
    const token = sign(tokenPayload, process.env.APP_SECRET ?? '', { expiresIn: '1d' });
    res.cookie('jwt', token, {
      httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ message: 'OK', token });
  } catch (error) {
    next(error);
  }
};

export default withAuth(requestMiddleware(refresh));
