declare namespace NodeJS {
  interface Process {
    /**
     * The electron app instance.
     */
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    electronApp: import('node:child_process').ChildProcess;
  }
}
