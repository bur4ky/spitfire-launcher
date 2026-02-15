export type EULACheckData = {
  key: string;
  version: number;
  revision: number;
  title: string;
  body: string;
  locale: string;
  createdTimestamp: number;
  lastModifiedTimestamp: number;
  status: string;
  custom: boolean;
  url: string;
  bodyFormat: string;
  wasDeclined: boolean;
  hasResponse: boolean;
};
