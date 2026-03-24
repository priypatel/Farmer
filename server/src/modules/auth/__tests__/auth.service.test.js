import { jest } from '@jest/globals';

// Mock dependencies before importing service
const mockFindUserByEmail = jest.fn();
const mockFreeDeletedUserEmail = jest.fn();
const mockFindUserByGoogleId = jest.fn();
const mockCreateEmailUser = jest.fn();
const mockCreateGoogleUser = jest.fn();
const mockGetUserById = jest.fn();
const mockCreateFarmerRecord = jest.fn();
const mockLinkGoogleToUser = jest.fn();
const mockSetUserPassword = jest.fn();
const mockSavePasswordResetToken = jest.fn();
const mockFindUserByResetToken = jest.fn();
const mockClearResetToken = jest.fn();
const mockVerifyGoogleToken = jest.fn();
const mockSendSetPasswordEmail = jest.fn();

jest.unstable_mockModule('../auth.query.js', () => ({
  findUserByEmail: mockFindUserByEmail,
  freeDeletedUserEmail: mockFreeDeletedUserEmail,
  findUserByGoogleId: mockFindUserByGoogleId,
  createEmailUser: mockCreateEmailUser,
  createGoogleUser: mockCreateGoogleUser,
  getUserById: mockGetUserById,
  createFarmerRecord: mockCreateFarmerRecord,
  linkGoogleToUser: mockLinkGoogleToUser,
  setUserPassword: mockSetUserPassword,
  savePasswordResetToken: mockSavePasswordResetToken,
  findUserByResetToken: mockFindUserByResetToken,
  clearResetToken: mockClearResetToken,
}));

jest.unstable_mockModule('../../../config/google.js', () => ({
  verifyGoogleToken: mockVerifyGoogleToken,
  default: {},
}));

jest.unstable_mockModule('../../../utils/email.js', () => ({
  sendSetPasswordEmail: mockSendSetPasswordEmail,
}));

const { register, loginWithEmail, loginWithGoogle, requestSetPassword, setPassword, getMe } = await import('../auth.service.js');

describe('Auth Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create user + farmer record for farmer role and return token', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockFreeDeletedUserEmail.mockResolvedValue();
      mockCreateEmailUser.mockResolvedValue(1);
      mockCreateFarmerRecord.mockResolvedValue(1);

      const result = await register('John', '1234567890', 'john@test.com', 'Password123', 'farmer');

      expect(mockCreateEmailUser).toHaveBeenCalledWith(
        'John', '1234567890', 'john@test.com', expect.any(String), 'farmer'
      );
      expect(mockCreateFarmerRecord).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('token');
      expect(result.user).toEqual({
        id: 1,
        firstName: 'John',
        email: 'john@test.com',
        role: 'farmer',
      });
    });

    it('should create user only (no farmer record) for admin role', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockFreeDeletedUserEmail.mockResolvedValue();
      mockCreateEmailUser.mockResolvedValue(2);

      const result = await register('Admin', null, 'admin@test.com', 'Password123', 'admin');

      expect(mockCreateEmailUser).toHaveBeenCalled();
      expect(mockCreateFarmerRecord).not.toHaveBeenCalled();
      expect(result.user.role).toBe('admin');
    });

    it('should free deleted email and create new user instead of reactivating', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockFreeDeletedUserEmail.mockResolvedValue();
      mockCreateEmailUser.mockResolvedValue(10);
      mockCreateFarmerRecord.mockResolvedValue(1);

      const result = await register('John', '1234567890', 'deleted@test.com', 'Password123', 'farmer');

      expect(mockFreeDeletedUserEmail).toHaveBeenCalledWith('deleted@test.com');
      expect(mockCreateEmailUser).toHaveBeenCalledWith(
        'John', '1234567890', 'deleted@test.com', expect.any(String), 'farmer'
      );
      expect(result).toHaveProperty('token');
      expect(result.user.id).toBe(10);
    });

    it('should throw 409 on duplicate email', async () => {
      mockFindUserByEmail.mockResolvedValue({ id: 1, email: 'existing@test.com' });

      await expect(
        register('John', null, 'existing@test.com', 'Password123', 'farmer')
      ).rejects.toMatchObject({ status: 409, message: 'Email already registered' });
    });
  });

  describe('loginWithEmail', () => {
    const mockUser = {
      id: 1,
      first_name: 'John',
      email: 'john@test.com',
      password: '$2b$10$J0cOZk5.Qh1SN0lGFOvAvOQ.2iEWRnto9pnRg4QugMsCSlIO67kUa', // Admin@123
      role: 'farmer',
    };

    it('should return token on valid credentials', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUser);

      const result = await loginWithEmail('john@test.com', 'Admin@123');

      expect(result).toHaveProperty('token');
      expect(result.user).toEqual({
        id: 1,
        firstName: 'John',
        email: 'john@test.com',
        role: 'farmer',
      });
    });

    it('should throw 403 with PASSWORD_NOT_SET for Google-only user', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: 2,
        first_name: 'Google',
        email: 'google@test.com',
        password: null,
        role: 'farmer',
        auth_type: 'google',
      });

      await expect(
        loginWithEmail('google@test.com', 'Password123')
      ).rejects.toMatchObject({
        status: 403,
        code: 'PASSWORD_NOT_SET',
      });
    });

    it('should throw 401 on wrong password', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUser);

      await expect(
        loginWithEmail('john@test.com', 'WrongPassword')
      ).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });
    });

    it('should throw 401 on unknown email', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      await expect(
        loginWithEmail('unknown@test.com', 'Password123')
      ).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });
    });
  });

  describe('loginWithGoogle', () => {
    const googlePayload = {
      sub: 'google-id-123',
      email: 'google@test.com',
      given_name: 'Google',
      name: 'Google User',
    };

    it('should return token for existing Google user', async () => {
      mockVerifyGoogleToken.mockResolvedValue(googlePayload);
      mockFindUserByGoogleId.mockResolvedValue({
        id: 5,
        first_name: 'Google',
        email: 'google@test.com',
        role: 'farmer',
      });

      const result = await loginWithGoogle('valid-google-credential');

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('google@test.com');
      expect(mockCreateGoogleUser).not.toHaveBeenCalled();
    });

    it('should link Google to existing email user', async () => {
      mockVerifyGoogleToken.mockResolvedValue(googlePayload);
      mockFindUserByGoogleId.mockResolvedValue(null);
      mockFindUserByEmail.mockResolvedValue({
        id: 3,
        first_name: 'John',
        email: 'google@test.com',
        role: 'farmer',
        password: 'hashed',
      });
      mockLinkGoogleToUser.mockResolvedValue();
      mockGetUserById.mockResolvedValue({
        id: 3,
        first_name: 'John',
        email: 'google@test.com',
        role: 'farmer',
      });

      const result = await loginWithGoogle('valid-google-credential');

      expect(mockLinkGoogleToUser).toHaveBeenCalledWith(3, 'google-id-123');
      expect(mockCreateGoogleUser).not.toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result.user.id).toBe(3);
    });

    it('should create new user + farmer record for new Google user', async () => {
      mockVerifyGoogleToken.mockResolvedValue(googlePayload);
      mockFindUserByGoogleId.mockResolvedValue(null);
      mockFindUserByEmail.mockResolvedValue(null);
      mockFreeDeletedUserEmail.mockResolvedValue();
      mockCreateGoogleUser.mockResolvedValue(10);
      mockCreateFarmerRecord.mockResolvedValue(1);
      mockGetUserById.mockResolvedValue({
        id: 10,
        first_name: 'Google',
        email: 'google@test.com',
        role: 'farmer',
      });

      const result = await loginWithGoogle('valid-google-credential');

      expect(mockFreeDeletedUserEmail).toHaveBeenCalledWith('google@test.com');
      expect(mockCreateGoogleUser).toHaveBeenCalledWith('Google', 'google@test.com', 'google-id-123', 'farmer');
      expect(mockCreateFarmerRecord).toHaveBeenCalledWith(10);
      expect(result).toHaveProperty('token');
    });

    it('should throw 401 on invalid Google credential', async () => {
      mockVerifyGoogleToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        loginWithGoogle('invalid-credential')
      ).rejects.toMatchObject({ status: 401, message: 'Invalid Google token' });
    });
  });

  describe('requestSetPassword', () => {
    it('should send set-password email for Google-only user', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: 2,
        email: 'google@test.com',
        password: null,
        auth_type: 'google',
      });
      mockSavePasswordResetToken.mockResolvedValue();
      mockSendSetPasswordEmail.mockResolvedValue();

      await requestSetPassword('google@test.com');

      expect(mockSavePasswordResetToken).toHaveBeenCalledWith(2, expect.any(String), expect.any(Date));
      expect(mockSendSetPasswordEmail).toHaveBeenCalledWith('google@test.com', expect.any(String));
    });

    it('should throw 400 if password already set', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: 1,
        email: 'john@test.com',
        password: 'hashed',
      });

      await expect(
        requestSetPassword('john@test.com')
      ).rejects.toMatchObject({ status: 400 });
    });

    it('should throw 404 if user not found', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      await expect(
        requestSetPassword('unknown@test.com')
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('setPassword', () => {
    it('should hash and set password for valid token', async () => {
      mockFindUserByResetToken.mockResolvedValue({ id: 2, email: 'google@test.com' });
      mockSetUserPassword.mockResolvedValue();
      mockClearResetToken.mockResolvedValue();

      await setPassword('valid-token', 'NewPassword123');

      expect(mockSetUserPassword).toHaveBeenCalledWith(2, expect.any(String));
      expect(mockClearResetToken).toHaveBeenCalledWith(2);
    });

    it('should throw 400 for invalid/expired token', async () => {
      mockFindUserByResetToken.mockResolvedValue(null);

      await expect(
        setPassword('expired-token', 'NewPassword123')
      ).rejects.toMatchObject({ status: 400, message: 'Invalid or expired token' });
    });
  });

  describe('getMe', () => {
    it('should return user data', async () => {
      mockGetUserById.mockResolvedValue({
        id: 1,
        first_name: 'John',
        email: 'john@test.com',
        role: 'farmer',
        auth_type: 'email',
      });

      const result = await getMe(1);

      expect(result).toEqual({
        id: 1,
        first_name: 'John',
        email: 'john@test.com',
        role: 'farmer',
        auth_type: 'email',
      });
    });

    it('should throw 404 if user not found', async () => {
      mockGetUserById.mockResolvedValue(null);

      await expect(getMe(999)).rejects.toMatchObject({
        status: 404,
        message: 'User not found',
      });
    });
  });
});
