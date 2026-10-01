/** Label and colours for a 0-100 wellness index */
export const getWellnessStatus = (score: number) => {
  if (score >= 75) {
    return { label: 'Saudável', message: 'Você está em um bom momento. Manter as pausas ao longo do dia ajuda a sustentar esse ritmo.', icon: 'check_circle', text: 'text-[#006947]', chip: 'bg-[#f5fff6] text-[#006947] border-[#6ffbbe]/40', stroke: 'text-[#00855b]' };
  }
  if (score >= 60) {
    return { label: 'Atenção', message: 'Há sinais de cansaço acumulado. Reserve pausas curtas hoje e proteja seu horário de descanso.', icon: 'info', text: 'text-[#9a4a00]', chip: 'bg-[#fff4e5] text-[#9a4a00] border-[#ffd8a8]', stroke: 'text-[#e08a00]' };
  }
  return { label: 'Precisa de cuidado', message: 'Seus sinais pedem cuidado. Vá com calma hoje e considere conversar com um especialista.', icon: 'favorite', text: 'text-[#ba1a1a]', chip: 'bg-[#ffdad6]/60 text-[#ba1a1a] border-[#ffdad6]', stroke: 'text-[#ba1a1a]' };
};
