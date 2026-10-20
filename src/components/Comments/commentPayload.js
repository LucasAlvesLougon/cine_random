export function buildCommentPayload(text, rating) {
    return {
        text: text.trim(),
        rating,
    };
}
