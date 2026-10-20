import { formatUserName } from '../../utils/format';

export function getCommentAuthor(comment) {
    return formatUserName(comment?.user_name || comment?.user_id);
}
