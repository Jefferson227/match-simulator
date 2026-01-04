import ErrorResult from './ErrorResult';

type OperationResult = {
  succeeded: boolean;
  error: ErrorResult;
};

export default OperationResult;
