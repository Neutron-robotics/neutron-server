import request from 'supertest';
import dotenv from 'dotenv';
import fs from 'fs';
import app from '../src/app';

jest.mock('../src/utils/nodemailer/sendEmail', () => jest.fn());

describe('File service', () => {
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }
  it('Upload a file', async () => {
    const resp = await request(app)
      .post('/file/upload')
      .attach('file', '__tests/__mixture__/image.png');

    const filePath = resp.body.url as string;
    const fileName = filePath.split('file/')[1];

    expect(resp.statusCode).toBe(200);
    expect(fileName).toBeDefined();
    expect(fileName.endsWith('.png')).toBeTruthy();
    expect(fs.lstatSync(`./data/${fileName}`).isFile()).toBeTruthy();

    fs.unlinkSync(`./data/${fileName}`);
  });

  it('Fetch a file', async () => {
    const resp = await request(app)
      .post('/file/upload')
      .attach('file', '__tests/__mixture__/image.png');

    const filePath = resp.body.url as string;
    const fileName = filePath.split('file/')[1];

    expect(resp.statusCode).toBe(200);
    expect(fileName).toBeDefined();

    const resFile = await request(app)
      .get(`/file/${fileName}`);

    expect(resFile.statusCode).toBe(200);
    expect(resFile.headers['content-type']).toEqual('image/png');
  });

  it.todo('Remove a file');

  it.todo('Changing users avatar removes the file');
});
