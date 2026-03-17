const TOAST_DURATION_MS = 2200;

export function mountActionToast({ container, store }) {
  const host = document.createElement('div');
  host.className = 'action-toast-host';

  const toast = document.createElement('div');
  toast.className = 'action-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.hidden = true;

  host.appendChild(toast);
  container.appendChild(host);

  let hideTimer = null;

  return (message) => {
    if (!message) return;
    if (store.documentData.settings.showActionToasts === false) return;

    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('is-visible');

    if (hideTimer) {
      clearTimeout(hideTimer);
    }

    hideTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.hidden = true;
      hideTimer = null;
    }, TOAST_DURATION_MS);
  };
}
