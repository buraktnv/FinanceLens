import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
  type JsonFn = (body: unknown) => void;

  function hostFor(response: { status: jest.Mock; json: JsonFn }) {
    return {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/api/test' }),
      }),
    } as unknown as ArgumentsHost;
  }

  function buildResponse() {
    const json = jest.fn<undefined, [unknown]>();
    const status = jest.fn().mockReturnValue({ json });
    return { status, json };
  }

  it('preserves HttpException status and message', () => {
    const { status, json } = buildResponse();

    new AllExceptionsFilter().catch(
      new BadRequestException('month must be an integer'),
      hostFor({ status, json } as never),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'month must be an integer',
      }),
    );
  });

  it('sanitizes unknown errors to a generic 500 without leaking internals', () => {
    const { status, json } = buildResponse();
    const leaky = new Error('connect ECONNREFUSED db.internal:5432');

    new AllExceptionsFilter().catch(leaky, hostFor({ status, json } as never));

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.statusCode).toBe(500);
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
    expect(JSON.stringify(body)).not.toContain('db.internal');
  });
});
