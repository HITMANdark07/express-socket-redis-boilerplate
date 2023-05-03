export interface IDecodedToken {
  aud?: string;
  jti?: string;
  iat?: number;
  nbf?: number;
  exp?: number;
  sub?: string;
  id?: string;
}
