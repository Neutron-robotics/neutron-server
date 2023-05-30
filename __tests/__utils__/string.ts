export function generateRandomString(n: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < n; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}
