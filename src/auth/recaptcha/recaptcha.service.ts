import { Injectable, UnauthorizedException } from "@nestjs/common";
import axios from "axios";
import qs from "qs";

@Injectable()
export class RecaptchaService {
  async validate(token: string): Promise<boolean> {
    const secret = process.env.HCAPTCHA_SECRET;

    if (!secret) throw new Error('HCAPTCHA_SECRET não definido');

    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const { data } = await axios.post(
      'https://hcaptcha.com/siteverify',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    console.log('🔍 hCaptcha response:', data);

    if (!data.success) {
      throw new UnauthorizedException('Falha na validação do hCaptcha');
    }

    return true;
  }
}
