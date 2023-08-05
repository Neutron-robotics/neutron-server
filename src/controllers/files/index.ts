import { Router } from 'express';
import upload from './upload';
import uploadFile from '../../utils/fileStorage';
import getFile from './getFile';

const useFileController = (router: Router) => {
  router.post('/file/upload', <any>uploadFile.single('file'), upload);
  router.get('/file/:fileId', getFile);
};

export default useFileController;
