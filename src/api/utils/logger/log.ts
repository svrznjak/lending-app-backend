// Pick library for logger
// Add loggin to

interface ILogOptions {
  logToFile: boolean;
  logToFirabase: boolean;
}

class Log {
  // default options
  options: ILogOptions;

  constructor(options: Partial<ILogOptions>) {
    this.options = { ...this.options, ...options };
  }

  info(message: string, optionsOverride: Partial<ILogOptions>): void {
    this.externalLog(message, optionsOverride);
    console.info(message);
  }

  private externalLog(message: string, optionsOverride: Partial<ILogOptions>): void {
    const options = { ...this.options, ...optionsOverride };
    if (options) {
      console.warn('TODO: Implement log to file!', message);
    }
    if (options) {
      console.warn('TODO: Implement log to Firebase!', message);
    }
  }
}

export const log = new Log({
  logToFile: false,
  logToFirabase: false,
});
