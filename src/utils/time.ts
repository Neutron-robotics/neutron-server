// eslint-disable-next-line no-promise-executor-return
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
