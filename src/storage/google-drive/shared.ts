export type TokenInfo = {
  token: string;
  expiration: Date;
};

export type AsyncFile = {
  name(): Promise<string>;
  mimeType(): Promise<string>;
  data(): Promise<ArrayBuffer>;
};
