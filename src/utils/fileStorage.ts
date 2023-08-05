import multer, { FileFilterCallback } from 'multer';
import e from 'express';
import getFileExtension from './getFileExtension';
import { BadRequest } from '../errors/bad-request';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, process.env.FILE_STORAGE ?? '');
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = getFileExtension(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
  }
});

const fileFilter = (
  req: e.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const extension = getFileExtension(file.originalname);
  if (extension === null) {
    cb(new BadRequest('File extension is required'));
  } else {
    cb(null, true);
  }
};

export default multer(({ storage, fileFilter }));
