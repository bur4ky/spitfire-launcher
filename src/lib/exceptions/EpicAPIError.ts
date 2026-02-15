import type { EpicAPIErrorData } from '$types/game/authorizations';
import type { KyRequest } from 'ky';

export class EpicAPIError extends Error implements EpicAPIErrorData {
  public errorCode: string;
  public errorMessage: string;
  public numericErrorCode: number;
  public messageVars: string[];

  public continuation?: string;
  public continuationUrl?: string;
  public correctiveAction?: string;

  public method?: string;
  public url?: string;
  public httpStatus?: number;

  constructor(error: EpicAPIErrorData, request?: KyRequest, status?: number) {
    super(error.errorMessage);

    this.name = 'EpicAPIError';
    this.errorCode = error.errorCode;
    this.errorMessage = error.errorMessage;
    this.numericErrorCode = error.numericErrorCode;
    this.messageVars = error.messageVars || [];

    this.continuation = error.continuation;
    this.continuationUrl = error.continuationUrl;
    this.correctiveAction = error.correctiveAction;

    this.method = request?.method?.toUpperCase();
    this.url = request?.url;
    this.httpStatus = status;
  }
}
