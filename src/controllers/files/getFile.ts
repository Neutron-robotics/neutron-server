import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import path from 'path';
import { existsSync } from 'fs';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest, NotFound } from '../../errors/bad-request';

const getFileSchemaParams = Joi.object().keys({
  fileId: Joi.string().required()
});

interface GetFileParams {
    fileId: string
  }

const getFile: RequestHandler<any> = async (req: Request<GetFileParams, {}, {}>, res, next) => {
  const { fileId } = req.params;

  try {
    const filePath = path.join(process.cwd(), process.env.FILE_STORAGE ?? '', fileId);
    if (!existsSync(filePath)) { throw new NotFound('The file does not exist'); };
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
