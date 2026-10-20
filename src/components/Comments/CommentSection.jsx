import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { getCommentAuthor } from './commentAuthor';
import { buildCommentPayload } from './commentPayload';
import styles from './CommentSection.module.css';

export function CommentSection({ movieId, initialComments = [] }) {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const commentsQueryKey = ['movie-comments', movieId];
    const { data: comments = [], isLoading } = useQuery({
        queryKey: commentsQueryKey,
        queryFn: async () => (await api.get(`/lists/movies/${movieId}/comments`)).data,
        enabled: Boolean(movieId),
        initialData: initialComments.length > 0 ? initialComments : undefined,
        staleTime: 60 * 1000,
    });
    const [text, setText] = useState('');
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            const response = await api.post(
                `/lists/movies/${movieId}/comments`,
                buildCommentPayload(text, rating)
            );
            queryClient.setQueryData(commentsQueryKey, current => [response.data, ...(current || [])]);
            setText('');
            setRating(5);
        } catch (error) {
            console.error("Erro ao adicionar comentário:", error);
            const detail = error.response?.data?.detail;
            addToast(
                typeof detail === 'string'
                    ? detail
                    : 'Não foi possível publicar o comentário.',
                'error'
            );
        }
    };

    const avgRating = comments.length > 0
        ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)
        : 0;

    return (
        <div className={styles.container}>
            <h3 className={styles.heading}>Avaliações do Grupo</h3>

            {comments.length > 0 && (
                <div className={styles.avgSection}>
                    <span className={styles.avgStars}>★ {avgRating}</span>
                    <span className={styles.avgLabel}>({comments.length} avaliações)</span>
                </div>
            )}

            <div className={styles.commentList}>
                {isLoading && comments.length === 0 ? (
                    <p className={styles.empty}>Carregando avaliações...</p>
                ) : comments.length === 0 ? (
                    <p className={styles.empty}>Ninguém avaliou este filme ainda. Seja o primeiro!</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className={styles.commentItem}>
                            <div className={styles.commentHeader}>
                                <strong className={styles.commentAuthor}>{getCommentAuthor(comment)}</strong>
                                <span className={styles.commentStars}>
                                    {Array(comment.rating).fill('★').join('')}
                                </span>
                            </div>
                            <p className={styles.commentText}>{comment.text}</p>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleAddComment} className={styles.form}>
                <div className={styles.formHeader}>
                    <span className={styles.formLabel}>Sua Avaliação</span>
                    <div className={styles.starInput} onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((starValue) => {
                            const isActive = starValue <= (hoverRating || rating);
                            return (
                                <button
                                    key={starValue}
                                    type="button"
                                    className={`${styles.starBtn} ${isActive ? styles.starSelected : ''}`}
                                    onClick={() => setRating(starValue)}
                                    onMouseEnter={() => setHoverRating(starValue)}
                                >
                                    ★
                                </button>
                            );
                        })}
                    </div>
                </div>
                <textarea
                    placeholder="O que achou deste filme?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className={styles.textarea}
                />
                <button type="submit" className={styles.btnSubmit}>
                    Publicar Comentário
                </button>
            </form>
        </div>
    );
}
