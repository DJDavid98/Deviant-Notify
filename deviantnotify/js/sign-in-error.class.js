export class SignInError extends Error {
  constructor() {
    super('You are not signed in');
    this.errorCode = 401;
  }

  get code() {
    return this.errorCode;
  }
}
