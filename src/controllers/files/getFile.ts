import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import path from 'path';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest } from '../../errors/bad-request';

const getFileSchemaParams = Joi.object().keys({
  fileId: Joi.string().required()
});

interface GetFileParams {
    fileId: string
  }

const getFile: RequestHandler<any> = async (req: Request<GetFileParams, {}, {}>, res, next) => {
  const { fileId } = req.params;

  try {
    const filePath = path.join(__dirname, process.env.FILE_STORAGE ?? '', fileId);
    res.download(filePath, err => {
      if (err) {
        throw new BadRequest(err.message);
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export default requestMiddleware(getFile, { validation: { params: getFileSchemaParams } });
