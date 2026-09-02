export function formatUserName(email) {
    if (!email) return 'Usuário';
    
    // Pega só a parte antes do @
    let prefix = email.split('@')[0];
    
    // Remove números do final ou do meio se desejar (opcional, mas o usuário pediu pra ficar limpo)
    // Vamos remover números pra ficar com cara de nome mesmo, ex: lucas123 -> lucas
    prefix = prefix.replace(/[0-9]/g, '');
    
    if (!prefix.trim()) return 'Usuário';

    // Troca pontos, underscores e traços por espaços
    const words = prefix.replace(/[._-]/g, ' ').split(' ').filter(w => w.length > 0);
    
    // Capitaliza cada palavra
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
