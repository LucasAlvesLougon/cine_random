import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import styles from './CommentSection.module.css';

export function CommentSection({ movieId }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);

    const [text, setText] = useState('');
    const [rating, setRating] = useState(5); // Alterado de string '5' para número 5
    const [hoverRating, setHoverRating] = useState(0); // Controle visual das estrelas

    const listCode = "teste123";

    useEffect(() => {
        const commentsRef = collection(db, 'lists', listCode, 'movies', movieId, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(loadedComments);
        });

        return () => unsubscribe();
    }, [movieId]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        const commentsRef = collection(db, 'lists', listCode, 'movies', movieId, 'comments');
        await addDoc(commentsRef, {
            userId: user?.uid || 'anonimo',
            userName: user?.displayName || user?.email?.split('@')[0] || 'Usuário',
            text: text,
            rating: rating,
            createdAt: serverTimestamp()
        });

        setText('');
        setRating(5);
    };

    // Calculando a média
    const avgRating = comments.length > 0
        ? (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)
        : 0;

    return (
        <div className={styles.container}>
            <h3 className={styles.heading}>Avaliações do Grupo</h3>

            {/* SEÇÃO DA MÉDIA GERAL */}
            {comments.length > 0 && (
                <div className={styles.avgSection}>
                    <span className={styles.avgStars}>★ {avgRating}</span>
                    <span className={styles.avgLabel}>({comments.length} avaliações)</span>
                </div>
            )}

            {/* LISTA DE COMENTÁRIOS */}
            <div className={styles.commentList}>
                {comments.length === 0 ? (
                    <p className={styles.empty}>Ninguém avaliou este filme ainda. Seja o primeiro!</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className={styles.commentItem}>
                            <div className={styles.commentHeader}>
                                <strong className={styles.commentAuthor}>{comment.userName}</strong>
                                <span className={styles.commentStars}>
                                    {Array(comment.rating).fill('★').join('')}
                                </span>
                            </div>
                            <p className={styles.commentText}>{comment.text}</p>
                        </div>
                    ))
                )}
            </div>

            {/* FORMULÁRIO DE AVALIAÇÃO COM ESTRELAS INTERATIVAS */}
            <form onSubmit={handleAddComment} className={styles.form}>
                <div className={styles.formHeader}>
                    <span className={styles.formLabel}>Sua Avaliação</span>

                    <div
                        className={styles.starInput}
                        onMouseLeave={() => setHoverRating(0)} // Quando o mouse sai da área, zera o hover visual
                    >
                        {[1, 2, 3, 4, 5].map((starValue) => {
                            // Decide se a estrela deve ficar dourada por estar selecionada OU pelo mouse estar em cima
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