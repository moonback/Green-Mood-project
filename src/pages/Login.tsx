import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import SEO from '../components/SEO';

type Mode = 'login' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasMinPasswordLength = password.length >= 8;
  const hasLetter = /[A-Za-zÀ-ÿ]/.test(password);
  const hasNumber = /\d/.test(password);

  const resetFeedback = () => {
    setError('');
    setSuccess('');
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    resetFeedback();
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === 'login') {
        await signIn(normalizedEmail, password);
        navigate('/compte');
      } else {
        if (!fullName.trim()) {
          setError('Le prénom et nom sont requis.');
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

        await signUp(normalizedEmail, password, fullName.trim());
        setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (msg.includes('User already registered')) {
        setError('Un compte existe déjà avec cet email.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title={mode === 'login' ? 'Connexion — Green Mood CBD' : 'Créer un compte — Green Mood CBD'}
        description="Connectez-vous ou créez un compte pour accéder à votre historique de commandes et programme de fidélité."
      />

      <div className="min-h-[calc(100vh-10rem)] bg-zinc-950 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
            {/* Tabs */}
            <div className="flex mb-8 bg-zinc-800 rounded-xl p-1">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  disabled={isLoading}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m
                    ? 'bg-green-neon text-white'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jean Dupont"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors"
                    required
                    autoComplete={mode === 'login' ? 'email' : 'username'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors"
                    required
                    minLength={mode === 'register' ? 8 : 6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'register' && (
                  <ul className="mt-2 space-y-1 text-xs">
                    <li className={hasMinPasswordLength ? 'text-green-400' : 'text-zinc-500'}>
                      • 8 caractères minimum
                    </li>
                    <li className={hasLetter ? 'text-green-400' : 'text-zinc-500'}>
                      • Au moins une lettre
                    </li>
                    <li className={hasNumber ? 'text-green-400' : 'text-zinc-500'}>
                      • Au moins un chiffre
                    </li>
                  </ul>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Confirmer le mot de passe</label>
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
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <Link to="/mot-de-passe-oublie" className="text-sm text-zinc-400 hover:text-green-neon transition-colors">
                    Mot de passe oublié ?
                  </Link>
                </div>
              )}

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
                disabled={isLoading}
                className="w-full bg-green-neon hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Chargement…
                  </span>
                ) : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </button>
            </form>

            <p className="text-center text-zinc-500 text-sm mt-6">
              En créant un compte, vous acceptez nos{' '}
              <Link to="/mentions-legales" className="text-green-neon hover:underline">
                conditions générales
              </Link>
              . Vous devez avoir 18 ans ou plus.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
