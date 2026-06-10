import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('GET /health → ok=true', async () => {
    const mod = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const ctrl = mod.get(HealthController);
    expect(ctrl.check().ok).toBe(true);
  });
});
