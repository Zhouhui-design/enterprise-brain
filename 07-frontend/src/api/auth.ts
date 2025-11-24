import api from './index';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  username: string;
  role: string;
}

/**
 * 用户登录
 * @param params 登录参数
 */
export const login = (params: LoginParams): Promise<LoginResult> => {
  return api.post('/auth/login', params);
};

/**
 * 用户注销
 */
export const logout = (): Promise<void> => {
  return api.post('/auth/logout');
};
