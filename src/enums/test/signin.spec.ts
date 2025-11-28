function mockSignIn(email: string, password: string): SignInResult {
  if (email === '2fa@example.com') {
    return {
      message: 'Two-factor authentication required',
      twoFactorRequired: true,
      email,
    };
  } else {
    return {
      message: 'Login successful',
      twoFactorRequired: false,
      access_token: 'fake-token-123',
    };
  }
}

describe('SignInResult', () => {
  it('should return 2FA required for users that need it', () => {
    const result = mockSignIn('2fa@example.com', 'password123');

    expect(result.twoFactorRequired).toBe(true);
    if (result.twoFactorRequired) {
      // Type narrowing para SignIn2FA
      expect(result).toHaveProperty('email', '2fa@example.com');
      expect(result).toHaveProperty('message', 'Two-factor authentication required');
    }
  });

  it('should return access token for successful login', () => {
    const result = mockSignIn('user@example.com', 'password123');

    expect(result.twoFactorRequired).toBe(false);
    if (!result.twoFactorRequired) {
      // Type narrowing para SignInSuccess
      expect(result).toHaveProperty('access_token', 'fake-token-123');
      expect(result).toHaveProperty('message', 'Login successful');
    }
  });
});
