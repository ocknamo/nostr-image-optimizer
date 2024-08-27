import type { GlobalSetupContext } from 'vitest/node'
import fs from 'fs';
import { resolve } from 'path';

export default async function setup({ provide }: GlobalSetupContext) {
  const image01 = await fs.promises.readFile(resolve(__dirname, 'images/test01.jpg'));

  const base64Image01 = image01.toString('base64');
  provide('testImages', { image01: base64Image01 });
}

// You can also extend `ProvidedContext` type
// to have type safe access to `provide/inject` methods:
declare module 'vitest' {
  export interface ProvidedContext {
    testImages: Record<string, string>;
  }
}