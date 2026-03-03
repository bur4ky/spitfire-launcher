import type { EpicAPIErrorData } from '$types/game/authorizations';

export class EpicAPIError extends Error implements EpicAPIErrorData {
  public errorCode: string;
  public errorMessage: string;
  public numericErrorCode: number;
  public messageVars: string[];

  public continuation?: string;
  public continuationUrl?: string;
  public correctiveAction?: string;

  constructor(error: EpicAPIErrorData) {
    super(error.errorMessage);

    this.name = 'EpicAPIError';

    this.errorCode = error.errorCode;
    this.errorMessage = error.errorMessage;
    this.numericErrorCode = error.numericErrorCode;
    this.messageVars = error.messageVars || [];

    this.continuation = error.continuation;
    this.continuationUrl = error.continuationUrl;
    this.correctiveAction = error.correctiveAction;
  }
}

export function isEpicAPIError(data: any): data is EpicAPIErrorData {
  return (data as EpicAPIErrorData)?.errorCode !== undefined;
}
