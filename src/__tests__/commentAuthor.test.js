import { describe, expect, it } from 'vitest';

import { getCommentAuthor } from '../components/Comments/commentAuthor';

describe('getCommentAuthor', () => {
  it('prefers the user name supplied by the API over the numeric user id', () => {
    expect(
      getCommentAuthor({ user_id: '42', user_name: 'lucas.lougon@example.com' }),
    ).toBe('Lucas');
  });

  it('derives the first name from a legacy email value', () => {
    expect(getCommentAuthor({ user_id: 'ana_maria@example.com' })).toBe('Ana');
  });

  it('falls back to the generic label when no usable identity exists', () => {
    expect(getCommentAuthor({ user_id: '42', user_name: '' })).toBe('Usuário');
    expect(getCommentAuthor({ user_id: null, user_name: null })).toBe('Usuário');
  });
});
