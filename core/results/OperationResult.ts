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

  getSuccess<TResult>(result: TResult): OperationResult<TResult> {
    const operation = new OperationResult(result);
    operation.succeeded = true;
    return operation;
  }

  getError<TResult>(result: TResult, err: ErrorResult): OperationResult<TResult> {
    const operation = new OperationResult(result);
    operation.succeeded = false;
    operation.error = err;
    return operation;
  }

  getResult(): TResult {
    return this.result;
  }
}

export default OperationResult;
