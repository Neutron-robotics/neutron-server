import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest } from '../../errors/bad-request';
import getFileExtension from '../../utils/getFileExtension';

const upload: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  const { file } = req;
  if (!file) {
    return next(new BadRequest('No file is found'));
  }
  res.json({ url: file.filename });
};

export default requestMiddleware(upload);
