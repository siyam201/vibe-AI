import { X, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (method: string) => void;
}

export const AuthModal = ({ isOpen, onClose, onLogin }: AuthModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-warning flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Log in to Vibe</span>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => onLogin('google')}
              variant="outline" 
              className="w-full h-12 gap-3 bg-gray-50 hover:bg-gray-100 text-gray-900 border-gray-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <Button 
              onClick={() => onLogin('email')}
              variant="outline" 
              className="w-full h-12 gap-3 bg-gray-50 hover:bg-gray-100 text-gray-900 border-gray-200"
            >
              <Mail className="w-5 h-5" />
              Continue with Email
            </Button>
          </div>

          {/* More Options */}
          <button className="w-full text-center text-sm text-gray-600 hover:text-gray-900 mt-4 py-2">
            View more options
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 my-4" />

          {/* Create Account */}
          <p className="text-center text-sm text-gray-600">
            New to Vibe?{' '}
            <button 
              onClick={() => onLogin('signup')}
              className="text-primary hover:underline font-medium"
            >
              Create account
            </button>
          </p>

          {/* Terms */}
          <p className="text-xs text-gray-400 text-center mt-6">
            This site is protected by reCAPTCHA Enterprise and the Google{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a> and{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a> apply.
          </p>
        </div>
      </div>
    </div>
  );
};
