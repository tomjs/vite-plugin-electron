declare namespace NodeJS {
  interface Process {
    /**
     * The electron app instance.
     */
    electronApp: import('node:child_process').ChildProcess;
  }
}
