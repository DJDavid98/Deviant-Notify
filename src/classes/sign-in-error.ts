export class SignInError extends Error {
  private readonly errorCode: number;

  constructor() {
    super('You are not signed in');
    this.errorCode = 401;
  }

  get code(): number {
    return this.errorCode;
  }
}
