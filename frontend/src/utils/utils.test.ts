import { describe, expect, it } from 'vitest';
import {
  moveItem,
  updateItem,
  removeItem,
  insertItem,
  appendItem,
} from './listHelpers';
import { getErrorMessage, isApiErrorWithStatus } from './errors';

describe('listHelpers', () => {
  it('moveItem moves an item up', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 'up')).toEqual(['b', 'a', 'c']);
  });

  it('moveItem moves an item down', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 'down')).toEqual(['b', 'a', 'c']);
  });

  it('moveItem does nothing at the edges', () => {
    expect(moveItem(['a', 'b'], 0, 'up')).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 'down')).toEqual(['a', 'b']);
  });

  it('moveItem does not mutate the input', () => {
    const input = ['a', 'b', 'c'];
    moveItem(input, 0, 'down');
    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('updateItem applies partial updates', () => {
    const input = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
    expect(updateItem(input, 0, { name: 'z' })).toEqual([
      { id: 1, name: 'z' },
      { id: 2, name: 'b' },
    ]);
    // original untouched
    expect(input[0]).toEqual({ id: 1, name: 'a' });
  });

  it('removeItem removes at index', () => {
    expect(removeItem(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });

  it('insertItem inserts at index', () => {
    expect(insertItem(['a', 'c'], 1, 'b')).toEqual(['a', 'b', 'c']);
  });

  it('appendItem appends to the end', () => {
    expect(appendItem(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });
});

describe('getErrorMessage', () => {
  it('extracts from Error instances', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('extracts from objects with a message', () => {
    expect(getErrorMessage({ message: 'omsg' })).toBe('omsg');
  });

  it('returns strings as-is', () => {
    expect(getErrorMessage('raw string')).toBe('raw string');
  });

  it('falls back for unknowns', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
  });
});

describe('isApiErrorWithStatus', () => {
  it('matches an ApiError-like object with the status', () => {
    expect(isApiErrorWithStatus({ status: 402, message: 'x' }, 402)).toBe(true);
    expect(isApiErrorWithStatus({ status: 402 }, 404)).toBe(false);
  });

  it('false for non-objects', () => {
    expect(isApiErrorWithStatus(null, 402)).toBe(false);
    expect(isApiErrorWithStatus(undefined, 402)).toBe(false);
    expect(isApiErrorWithStatus('x', 402)).toBe(false);
  });
});
