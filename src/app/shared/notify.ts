import { ToastrService } from 'ngx-toastr';

/**
 * Non-blocking messages (toasts) in place of browser alert() pop-ups.
 *
 * Call notify('Saved', 'success') anywhere. Without a kind, it's guessed from the wording.
 * AppComponent registers the toast service at start-up; before that (or in tests) it falls
 * back to the browser alert so no message is ever lost.
 */
export type NotifyKind = 'success' | 'error' | 'warning' | 'info';

let toastr: ToastrService | null = null;

export function registerNotifier(service: ToastrService): void {
  toastr = service;
}

const ERROR = /(fail|error|could ?n[o']t|cannot|can't|unable|invalid|denied|not allowed|unauthori|went wrong|problem|declin|not found|expired)/i;
const WARNING = /(please|must|required|select |enter |choose|at least|minimum|maximum|exceed|not available|coming soon|already|no .* found|above your|limit|eligib|overdue|verify)/i;
const SUCCESS = /(success|saved|updated|created|approved|submitted|sent|deleted|removed|copied|confirmed|placed|received|verified|added|uploaded|cancelled|resolved|reset|marked)/i;

export function guessKind(text: string): NotifyKind {
  if (ERROR.test(text)) return 'error';
  if (WARNING.test(text)) return 'warning';
  if (SUCCESS.test(text)) return 'success';
  return 'info';
}

export function notify(message: unknown, kind?: NotifyKind): void {
  const text = typeof message === 'string' ? message : String(message ?? '');
  if (!text.trim()) return;
  const k = kind ?? guessKind(text);
  if (!toastr) {
    window.alert(text);
    return;
  }
  const title = { success: 'Done', error: 'Something went wrong', warning: 'Please check', info: 'Note' }[k];
  toastr[k](text, title, {
    timeOut: k === 'error' ? 9000 : k === 'warning' ? 7000 : 5000,
    extendedTimeOut: 3000,
    closeButton: true,
    progressBar: true,
    tapToDismiss: true,
  });
}
