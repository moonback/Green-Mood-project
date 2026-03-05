import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import SEO from '../components/SEO';

export default function ResetPassword() {
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasMinPasswordLength = password.length >= 8;
  const hasLetter = /[A-Za-zÀ-ÿ]/.test(password);
  const hasNumber = /\d/.test(password);

  useEffect(() => {
    if (!isAuthLoading && !session) {
      setError('Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.');
    }
  }, [isAuthLoading, session]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!session) {
      setError('Session de réinitialisation introuvable. Recommencez depuis le lien email.');
      return;
    }

    if (!hasMinPasswordLength || !hasLetter || !hasNumber) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      setSuccess('Votre mot de passe a bien été mis à jour.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/connexion'), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Nouveau mot de passe — Green Mood CBD"
        description="Définissez un nouveau mot de passe pour votre compte Green Mood CBD."
      />

      <div className="min-h-[calc(100vh-10rem)] bg-zinc-950 flex items-center justify-center px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
            <h1 className="text-2xl font-semibold text-white mb-2">Créer un nouveau mot de passe</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Après validation, vous pourrez vous reconnecter avec votre nouveau mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Confirmer le nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <ul className="space-y-1 text-xs">
                <li className={hasMinPasswordLength ? 'text-green-400' : 'text-zinc-500'}>• 8 caractères minimum</li>
                <li className={hasLetter ? 'text-green-400' : 'text-zinc-500'}>• Au moins une lettre</li>
                <li className={hasNumber ? 'text-green-400' : 'text-zinc-500'}>• Au moins un chiffre</li>
              </ul>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-900/30 border border-green-700 rounded-xl px-4 py-3 text-green-400 text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isAuthLoading || !session}
                className="w-full bg-green-neon hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {isLoading ? 'Mise à jour…' : 'Mettre à jour mon mot de passe'}
              </button>
            </form>

            <p className="text-center text-zinc-500 text-sm mt-6">
              <Link to="/mot-de-passe-oublie" className="text-green-neon hover:underline">
                Demander un nouveau lien
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
