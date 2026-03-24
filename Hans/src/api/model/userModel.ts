export interface UserItem {
  id: number;
  username: string;
  displayName: string;
  isEnabled: boolean;
  lastLoginTime?: string;
  createdTime: string;
}

export interface CreateUserParams {
  username: string;
  password: string;
  displayName: string;
}

export interface UpdateUserParams {
  displayName: string;
}

export interface ResetPasswordParams {
  newPassword: string;
}
