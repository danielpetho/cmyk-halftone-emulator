/// <reference types="vite/client" />

// Declare module for importing .glsl files as raw strings
declare module '*.glsl?raw' {
  const content: string;
  export default content;
}

declare module '*.glsl' {
  const content: string;
  export default content;
}

