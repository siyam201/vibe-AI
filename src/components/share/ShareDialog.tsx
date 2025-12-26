import { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Users, 
  Link2,
  Mail,
  Globe,
  Lock,
  GitFork,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectUrl: string;
}

interface Collaborator {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
}

const mockCollaborators: Collaborator[] = [
  { id: '1', email: 'you@example.com', name: 'You', role: 'owner' },
];

export const ShareDialog = ({ isOpen, onClose, projectName, projectUrl }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    
    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      email: inviteEmail,
      name: inviteEmail.split('@')[0],
      role: inviteRole,
    };
    
    setCollaborators([...collaborators, newCollaborator]);
    setInviteEmail('');
    toast.success(`Invitation sent to ${inviteEmail}`);
  };

  const handleFork = () => {
    toast.success('Project forked successfully!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{projectName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-2">
              {visibility === 'private' ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Globe className="w-4 h-4 text-green-400" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {visibility === 'private' ? 'Private' : 'Public'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {visibility === 'private' 
                    ? 'Only invited people can access'
                    : 'Anyone with the link can view'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibility(v => v === 'private' ? 'public' : 'private')}
            >
              {visibility === 'private' ? 'Make Public' : 'Make Private'}
            </Button>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Project Link</label>
            <div className="flex gap-2">
              <Input
                value={projectUrl}
                readOnly
                className="bg-secondary"
              />
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Invite by Email */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Invite Collaborators</label>
            <div className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                type="email"
              />
              <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Collaborators List */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Collaborators ({collaborators.length})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {collaborators.map((collab) => (
                <div 
                  key={collab.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {collab.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{collab.name}</p>
                      <p className="text-xs text-muted-foreground">{collab.email}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded capitalize",
                    collab.role === 'owner' ? "bg-primary/20 text-primary" :
                    collab.role === 'editor' ? "bg-blue-500/20 text-blue-400" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {collab.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fork Button */}
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={handleFork}
          >
            <GitFork className="w-4 h-4" />
            Fork this project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
