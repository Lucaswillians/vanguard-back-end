import { UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { RecaptchaService } from '../recaptcha.service';

jest.mock('axios'); // <-- MOCK do axios

describe('RecaptchaService', () => {
  let recaptchaService: RecaptchaService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    recaptchaService = new RecaptchaService();
    process.env.HCAPTCHA_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  it('deve retornar true quando o hCaptcha validar com sucesso', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true },
    });

    const result = await recaptchaService.validate('mock-token');

    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  it('deve lançar UnauthorizedException quando o hCaptcha falhar', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: false },
    });

    await expect(recaptchaService.validate('mock-token'))
      .rejects
      .toThrow(UnauthorizedException);
  });

  it('deve lançar erro se a variável HCAPTCHA_SECRET não estiver definida', async () => {
    delete process.env.HCAPTCHA_SECRET;

    await expect(recaptchaService.validate('mock-token'))
      .rejects
      .toThrow('HCAPTCHA_SECRET não definido');
  });
});
