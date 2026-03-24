export interface LoginParams {
  account: string;
  password: string;
}

export interface LoginResult {
  token: string;
  expiresIn: number;
}

export interface ProfileResult {
  id: number;
  username: string;
  displayName: string;
}
