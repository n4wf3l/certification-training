import AppLayout from '@/Layouts/AppLayout';
import Icon from '@/Components/Icons';
import { Head, Link, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth?.user;

    return (
        <AppLayout>
            <Head title="Profil" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
                        <Link href={route('home')} className="hover:text-brand-500">Certifications</Link>
                        <span>/</span>
                        <span className="text-ink-700 dark:text-ink-300">Profil</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-iris-500 text-lg font-bold text-white shadow-glow">
                            {(user?.name || '?')
                                .split(' ')
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                        </span>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                                {user?.name || 'Mon profil'}
                            </h1>
                            <p className="mt-1 text-sm text-ink-500">
                                {user?.email}
                                {user?.is_admin && (
                                    <span className="badge-brand ml-2 !py-0 text-[10px]">Admin</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <section className="card p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Icon.User className="h-4 w-4 text-ink-500" />
                        <h2 className="text-base font-semibold text-ink-900 dark:text-white">
                            Informations
                        </h2>
                    </div>
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </section>

                <section className="card p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Icon.Shield className="h-4 w-4 text-ink-500" />
                        <h2 className="text-base font-semibold text-ink-900 dark:text-white">
                            Mot de passe
                        </h2>
                    </div>
                    <UpdatePasswordForm className="max-w-xl" />
                </section>

                <section className="card border-rose-500/20 p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Icon.Close className="h-4 w-4 text-rose-500" />
                        <h2 className="text-base font-semibold text-rose-600 dark:text-rose-300">
                            Zone dangereuse
                        </h2>
                    </div>
                    <DeleteUserForm className="max-w-xl" />
                </section>
            </div>
        </AppLayout>
    );
}
