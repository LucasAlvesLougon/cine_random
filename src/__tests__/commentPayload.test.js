import { describe, expect, it } from 'vitest';
import { buildCommentPayload } from '../components/Comments/commentPayload';

describe('buildCommentPayload', () => {
    it('envia somente os campos aceitos pela API e remove espaços externos', () => {
        expect(buildCommentPayload('  Gostei bastante  ', 5)).toEqual({
            text: 'Gostei bastante',
            rating: 5,
        });
    });
});
