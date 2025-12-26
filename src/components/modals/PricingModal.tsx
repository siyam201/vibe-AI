import { X, Check, Plus, Gift, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal = ({ isOpen, onClose }: PricingModalProps) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center pt-8 pb-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">Compare Vibe plans</h2>
          <p className="text-muted-foreground">Autonomy for all. Choose the best plan for you.</p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setBilling('monthly')}
              className={cn(
                "text-sm font-medium transition-colors",
                billing === 'monthly' ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={cn(
                "text-sm font-medium flex items-center gap-2 transition-colors",
                billing === 'yearly' ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Yearly
              <span className="flex items-center gap-1 text-xs text-success">
                <Tag className="w-3 h-3" />
                Up to 20% off
              </span>
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Plans Grid */}
        <div className="grid grid-cols-3 gap-4 p-6">
          {/* Starter Plan */}
          <div className="p-6 rounded-xl bg-secondary/30">
            <h3 className="text-lg font-semibold text-foreground mb-1">Starter</h3>
            <div className="text-3xl font-bold text-foreground mb-4">Free</div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                Free daily Agent credits
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                Free credits for AI integrations
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                Publish 1 app
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                Limited Agent intelligence
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Your current plan
            </Button>
          </div>

          {/* Core Plan */}
          <div className="p-6 rounded-xl border-2 border-primary bg-card relative">
            <span className="absolute -top-3 right-4 px-2 py-1 text-xs font-medium text-primary bg-primary/20 rounded-full">
              20% off
            </span>
            <h3 className="text-lg font-semibold text-foreground mb-1">Vibe Core</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-foreground">$20</span>
              <span className="text-sm text-muted-foreground">per month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">billed annually</p>
            <p className="text-sm text-foreground mb-4">Create, launch, and share your apps.</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Plus className="w-4 h-4 text-muted-foreground" />
                Everything in Starter
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                $25 of monthly credits
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                Access to latest models
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                Publish and host live apps
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                Autonomous long builds
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                Remove "Made with Vibe" badge
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                Pay-as-you-go for additional usage
              </li>
            </ul>

            <div className="flex items-center gap-2 text-sm text-success mb-4">
              <Gift className="w-4 h-4" />
              <span>Limited time offer</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Save $10 on your first year</p>
            <label className="flex items-center gap-2 text-sm text-foreground mb-4">
              <input type="checkbox" className="accent-primary" defaultChecked />
              Apply coupon
            </label>

            <Button className="w-full gap-2">
              Continue with Core
              <span>→</span>
            </Button>
          </div>

          {/* Teams Plan */}
          <div className="p-6 rounded-xl bg-secondary/30 relative">
            <span className="absolute -top-3 right-4 px-2 py-1 text-xs font-medium text-muted-foreground bg-secondary rounded-full">
              13% off
            </span>
            <h3 className="text-lg font-semibold text-foreground mb-1">Teams</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-foreground">$35</span>
              <span className="text-sm text-muted-foreground">per user</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">billed annually</p>
            <p className="text-sm text-foreground mb-4">Bring Vibe to your entire team.</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Plus className="w-4 h-4 text-muted-foreground" />
                Everything in Core
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                $40 monthly credits
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                Upfront credits on annual plan
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                50 Viewer seats
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                Centralized billing
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                Role-based access control
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary" />
                Private deployments
              </li>
            </ul>

            <Button variant="outline" className="w-full gap-2">
              Continue with Teams
              <span>→</span>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-6">
          *Prices are subject to tax depending on your location. Vibe Agent is powered by large language models.
        </p>
      </div>
    </div>
  );
};
