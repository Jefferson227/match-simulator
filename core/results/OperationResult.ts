import ErrorResult from './ErrorResult';

class OperationResultBase {
  succeeded: boolean;
  error: ErrorResult;

  constructor() {
    this.succeeded = false;
    this.error = {
      errorCode: 'no-error',
      message: '',
      details: '',
    };
  }
}

class OperationResult<TResult> extends OperationResultBase {
  constructor(private result: TResult) {
    super();
  }

  setSuccess(): void {
    this.succeeded = true;
  }

  setError(err: ErrorResult): void {
    this.succeeded = false;
    this.error = err;
  }

  getResult(): TResult {
    return this.result;
  }
}

export default OperationResult;
