declare namespace NodeJS {
  interface Process {
    __tomjs_electron_serve__: { kill: () => void };
  }
}
