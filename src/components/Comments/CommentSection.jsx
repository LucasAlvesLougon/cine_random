import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import styles from './CommentSection.module.css';

export function CommentSection({ movieId }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);

    // Estados "Controlados" (Controlled Components) para o formulário
    const [text, setText] = useState('');
    const [rating, setRating] = useState('5');

    const listCode = "teste123";

    // Buscar comentários em tempo real
    useEffect(() => {
    // Caminho da subcoleção: lists -> teste123 -> movies -> {movieId} -> comments
    const commentsRef = collection(db, 'lists', listCode, 'movies', movieId, 'comments');

    // Ordena os comentários do mais recente para o mais antigo
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
    e.preventDefault(); // Impede o form de recarregar a página
    if (!text.trim()) return;

    const commentsRef = collection(db, 'lists', listCode, 'movies', movieId, 'comments');

    await addDoc(commentsRef, {
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0], // Tenta usar o nome ou pega a primeira parte do email
        text: text,
        rating: Number(rating),
        createdAt: serverTimestamp() // Usa a hora exata do servidor do Firebase
    });

    setText(''); // Limpa o campo após enviar
    setRating('5');
    };

    return (
    <div className={styles.container}>
        {/* LISTA DE COMENTÁRIOS */}
        <div className={styles.commentList}>
        {comments.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: '#888' }}>Seja o primeiro a comentar!</p>
        ) : (
            comments.map(comment => (
            <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                <strong>{comment.userName}</strong>
                <span>{Array(comment.rating).fill('⭐').join('')}</span>
                </div>
                <p style={{ margin: 0 }}>{comment.text}</p>
            </div>
            ))
        )}
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleAddComment} className={styles.form}>
        <textarea
            placeholder="O que achou deste filme?"
            rows="2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={styles.textarea}
        />
        <div className={styles.footerForm}>
            <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ padding: '4px' }}>
            <option value="5">5 Estrelas</option>
            <option value="4">4 Estrelas</option>
            <option value="3">3 Estrelas</option>
            <option value="2">2 Estrelas</option>
            <option value="1">1 Estrela</option>
            </select>
            <button type="submit" className={styles.btnSubmit}>Enviar</button>
        </div>
        </form>
    </div>
    );
}