export const triggerHaptic = (type = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'selection':
          navigator.vibrate(12);
          break;
        case 'light':
          navigator.vibrate(22);
          break;
        case 'medium':
          navigator.vibrate(40);
          break;
        case 'success':
          navigator.vibrate([20, 60, 30]);
          break;
        case 'warning':
          navigator.vibrate([40, 40, 60]);
          break;
        default:
          navigator.vibrate(20);
      }
    } catch {
      // Ignored if hardware haptics are restricted by browser
    }
  }
};
