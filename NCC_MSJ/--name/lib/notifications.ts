// Toast notification utility for user feedback
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function showToast(
  message: string,
  type: NotificationType = 'info',
  options: ToastOptions = {}
) {
  const { duration = 3000, position = 'top-right' } = options;

  const toast = document.createElement('div');
  
  const bgColor = {
    success: 'bg-green-500/10 border-green-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
  }[type];

  const textColor = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    warning: 'text-yellow-400',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }[type];

  const positionClass = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }[position];

  toast.className = `fixed ${positionClass} max-w-md ${bgColor} border rounded-lg p-4 flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300`;
  
  toast.innerHTML = `
    <div class="flex-shrink-0 w-5 h-5 rounded-full ${textColor} flex items-center justify-center font-bold text-sm">
      ${icon}
    </div>
    <p class="${textColor} text-sm font-medium">${message}</p>
  `;

  document.body.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-4');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
}

export function showSuccess(message: string, duration?: number) {
  return showToast(message, 'success', { duration });
}

export function showError(message: string, duration?: number) {
  return showToast(message, 'error', { duration: duration || 5000 });
}

export function showInfo(message: string, duration?: number) {
  return showToast(message, 'info', { duration });
}

export function showWarning(message: string, duration?: number) {
  return showToast(message, 'warning', { duration });
}
