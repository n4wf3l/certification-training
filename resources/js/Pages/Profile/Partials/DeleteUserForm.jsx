import { useT } from '@/lib/i18n';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function DeleteUserForm({ className = '' }) {
    const t = useT();
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({
        password: '',
    });

    const deleteUser = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => close(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const close = () => {
        setConfirming(false);
        clearErrors();
        reset();
    };

    return (
        <div className={className}>
            <p className="mb-4 text-sm text-ink-500">
                {t('profile.delete_hint_prefix')} <span className="font-semibold text-rose-500">{t('profile.delete_hint_strong')}</span>{t('profile.delete_hint_suffix')}
            </p>
            <button
                type="button"
                onClick={() => setConfirming(true)}
                className="btn border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-300"
            >
                {t('profile.delete_cta')}
            </button>

            {confirming && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-fade-in"
                    onClick={close}
                >
                    <form
                        onSubmit={deleteUser}
                        onClick={(e) => e.stopPropagation()}
                        className="card w-full max-w-md animate-scale-in p-6"
                    >
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-ink-900 dark:text-white">
                                {t('profile.delete_confirm_title')}
                            </h3>
                            <p className="mt-1 text-sm text-ink-500">
                                {t('profile.delete_confirm_body')}
                            </p>
                        </div>
                        <div>
                            <label className="field-label" htmlFor="delete_password">{t('profile.delete_field_password')}</label>
                            <input
                                id="delete_password"
                                type="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="field"
                                autoFocus
                            />
                            {errors.password && <p className="mt-1.5 text-xs text-rose-500">{errors.password}</p>}
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={close} className="btn-secondary">
                                {t('profile.delete_cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn bg-rose-500 text-white hover:bg-rose-600"
                            >
                                {processing ? t('profile.delete_deleting') : t('profile.delete_submit')}
                            </button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
}
