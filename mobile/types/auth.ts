export type AuthLoginResponse = {
  token: string;
  role: string;
  userId: number;
  name: string;
  email: string;
  profileId?: number;
  companyRole?: string | null;
  mustChangePassword?: boolean;
};

export type AuthLoginRequest = {
  email: string;
  password: string;
};
