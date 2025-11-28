type SignIn2FA = {
  message: string;
  twoFactorRequired: true;
  email: string;
};

type SignInSuccess = {
  message: string;
  twoFactorRequired: false;
  access_token: string;
};

type SignInResult = SignIn2FA | SignInSuccess;