import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import {
  BoundedIntPipe,
  LIMIT_PIPE,
  MONTH_PIPE,
  YEAR_PIPE,
} from './bounded-int.pipe';

describe('BoundedIntPipe', () => {
  const metadata: ArgumentMetadata = {
    type: 'query',
    metatype: String,
    data: 'limit',
  };

  it('passes undefined through untouched (optional query params)', async () => {
    await expect(
      LIMIT_PIPE.transform(undefined, metadata),
    ).resolves.toBeUndefined();
  });

  it('parses valid numeric strings within bounds', async () => {
    await expect(LIMIT_PIPE.transform('25', metadata)).resolves.toBe(25);
    await expect(MONTH_PIPE.transform('6', metadata)).resolves.toBe(6);
    await expect(YEAR_PIPE.transform('2024', metadata)).resolves.toBe(2024);
  });

  it('rejects non-numeric input with BadRequestException', async () => {
    await expect(MONTH_PIPE.transform('abc', metadata)).rejects.toThrow(
      BadRequestException,
    );
    await expect(YEAR_PIPE.transform('19x9', metadata)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects values below the lower bound with BadRequestException', async () => {
    await expect(LIMIT_PIPE.transform('0', metadata)).rejects.toThrow(
      BadRequestException,
    );
    await expect(MONTH_PIPE.transform('-1', metadata)).rejects.toThrow(
      BadRequestException,
    );
    await expect(YEAR_PIPE.transform('1969', metadata)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects values above the upper bound with BadRequestException', async () => {
    await expect(LIMIT_PIPE.transform('101', metadata)).rejects.toThrow(
      BadRequestException,
    );
    await expect(MONTH_PIPE.transform('13', metadata)).rejects.toThrow(
      BadRequestException,
    );
    await expect(YEAR_PIPE.transform('2101', metadata)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('accepts boundary values', async () => {
    await expect(LIMIT_PIPE.transform('1', metadata)).resolves.toBe(1);
    await expect(LIMIT_PIPE.transform('100', metadata)).resolves.toBe(100);
    await expect(MONTH_PIPE.transform('1', metadata)).resolves.toBe(1);
    await expect(MONTH_PIPE.transform('12', metadata)).resolves.toBe(12);
    await expect(YEAR_PIPE.transform('1970', metadata)).resolves.toBe(1970);
    await expect(YEAR_PIPE.transform('2100', metadata)).resolves.toBe(2100);
  });

  it('constructs custom bounds via BoundedIntPipe directly', async () => {
    const pipe = new BoundedIntPipe(10, 20);
    await expect(pipe.transform('15', metadata)).resolves.toBe(15);
    await expect(pipe.transform('9', metadata)).rejects.toThrow(
      BadRequestException,
    );
  });
});
