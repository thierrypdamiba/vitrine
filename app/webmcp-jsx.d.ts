import 'react';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- T is part of the augmented signature.
  interface FormHTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
  }
}
