import ErrorCode from './ErrorCode';

type ErrorResult = {
  errorCode: ErrorCode;
  message: string;
  details: string;
};

export default ErrorResult;
