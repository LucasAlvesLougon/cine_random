export function getPeriodOfDay() { const hour = new Date().getHours(); if (hour >= 5 && hour < 12) return 'Manhã'; if (hour >= 12 && hour < 18) return 'Tarde'; return 'Noite'; }
