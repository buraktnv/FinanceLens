import {
  ArgumentMetadata,
  BadRequestException,
  ParseIntPipe,
  PipeTransform,
} from '@nestjs/common';

/**
 * Optional-aware integer pipe built on ParseIntPipe that additionally enforces
 * inclusive min/max bounds. Missing query params (undefined) pass through so
 * handlers can apply their own defaults.
 */
export class BoundedIntPipe
  implements PipeTransform<string | undefined, Promise<number | undefined>>
{
  private readonly parser = new ParseIntPipe();

  constructor(
    private readonly min: number,
    private readonly max: number,
  ) {}

  async transform(
    value: string | undefined,
    metadata?: ArgumentMetadata,
  ): Promise<number | undefined> {
    if (value === undefined) {
      return undefined;
    }

    const parsed = await this.parser.transform(
      value,
      metadata ?? ({ type: 'query' } as ArgumentMetadata),
    );

    if (parsed < this.min || parsed > this.max) {
      throw new BadRequestException(
        `${metadata?.data ?? 'value'} must be an integer between ${this.min} and ${this.max}`,
      );
    }

    return parsed;
  }
}

export const LIMIT_PIPE = new BoundedIntPipe(1, 100);
export const MONTH_PIPE = new BoundedIntPipe(1, 12);
export const YEAR_PIPE = new BoundedIntPipe(1970, 2100);
