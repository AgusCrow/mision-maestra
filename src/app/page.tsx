'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/use-socket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Target, 
  Plus, 
  UserPlus,
  Activity,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description?: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
  };
  members: Array<{
    user: {
      id: string;
      username: string;
      displayName: string;
      isOnline: boolean;
    };
  }>;
  _count: {
    members: number;
    tasks: number;
  };
  score: number;
  level: number;
}

interface Invitation {
  id: string;
  team: {
    id: string;
    name: string;
    description?: string;
  };
  inviter: {
    id: string;
    username: string;
    displayName: string;
  };
  message?: string;
  createdAt: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const { toast } = useToast();
  const { socket, isConnected, onlineUsers, error } = useSocket({
    userId: user?.id,
    username: user?.username,
  });

  // Handle socket connection errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Connection error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Load user's teams
  useEffect(() => {
    if (user) {
      loadUserTeams();
      loadInvitations();
    }
  }, [user]);

  const loadUserTeams = async () => {
    try {
      const response = await fetch(`/api/teams?userId=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await fetch(`/api/invitations?userId=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        toast({
          title: "Welcome back",
          description: `Hello, ${data.user.displayName}!`,
        });
      } else {
        toast({
          title: "Login failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, displayName }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        toast({
          title: "Account created",
          description: `Welcome to Mission Master, ${data.user.displayName}!`,
        });
      } else {
        toast({
          title: "Registration failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!user) return;

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      setUser(null);
      setTeams([]);
      setInvitations([]);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
          creatorId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTeams([data.team, ...teams]);
        setNewTeamName('');
        setNewTeamDescription('');
        setShowCreateTeam(false);
        toast({
          title: "Team created",
          description: `Team "${data.team.name}" has been created successfully!`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    }
  };

  const handleRespondToInvitation = async (invitationId: string, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await fetch('/api/invitations/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationId,
          userId: user.id,
          action,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
        
        if (action === 'ACCEPTED') {
          await loadUserTeams();
          toast({
            title: "Team joined",
            description: "Welcome to your new team!",
          });
        } else {
          toast({
            title: "Invitation declined",
            description: "You have declined the team invitation.",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to invitation",
        variant: "destructive",
      });
    }
  };

  const handleInviteUser = async (inviteeId: string, teamId: string) => {
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          inviteeId,
          inviterId: user.id,
          message: `Join our team ${teams.find(t => t.id === teamId)?.name}!`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Invitation sent",
          description: "Invitation has been sent successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  // Calculate level progress
  const getLevelProgress = (level: number, experience: number) => {
    const expForNextLevel = level * 100;
    return (experience % expForNextLevel) / expForNextLevel * 100;
  };

  if (user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Mission Master</h1>
              <p className="text-sm text-gray-500">Team task management</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-600">
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600">
                  {onlineUsers.length} users online
                </span>
                {invitations.length > 0 && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-blue-600">
                      {invitations.length} invitation{invitations.length > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{user.displayName}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-3 w-3" />
                  Level {user.level}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-xs">●</span>
                  {user.coins} coins
                </div>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-sm">
                  {user.displayName?.[0] || user.username?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Level {user.level}</span>
                      <span className="text-gray-900 font-medium">{user.experience} XP</span>
                    </div>
                    <Progress value={getLevelProgress(user.level, user.experience)} className="h-1" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Points</span>
                      <span className="font-medium">{user.points}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coins</span>
                      <span className="font-medium">{user.coins}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teams
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {teams.length === 0 ? (
                    <p className="text-sm text-gray-500">No teams yet</p>
                  ) : (
                    teams.map((team) => (
                      <div key={team.id} className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{team.name}</h4>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              Lvl {team.level}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {team._count.members}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {team._count.tasks} tasks • {team.score} pts
                        </p>
                        <Link href={`/team`} className="w-full">
                          <Button size="sm" variant="outline" className="w-full text-xs">
                            View Team
                          </Button>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
                <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-3" size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Create team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg">Create team</DialogTitle>
                      <DialogDescription>
                        Form a new team to collaborate with others
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="team-name">Team name</Label>
                        <Input
                          id="team-name"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="Enter team name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="team-description">Description (optional)</Label>
                        <Textarea
                          id="team-description"
                          value={newTeamDescription}
                          onChange={(e) => setNewTeamDescription(e.target.value)}
                          placeholder="Enter team description"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()} className="flex-1">
                          Create
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-500 mb-3">No active tasks</p>
                <Button className="w-full" size="sm">
                  Create task
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Active now
                </CardTitle>
                <CardDescription className="text-xs">
                  {onlineUsers.length} users online
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {onlineUsers.length === 0 ? (
                    <p className="text-sm text-gray-500">No other users online</p>
                  ) : (
                    onlineUsers.map((onlineUser) => (
                      <div key={onlineUser.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={onlineUser.avatar} />
                          <AvatarFallback className="text-xs">
                            {onlineUser.displayName?.[0] || onlineUser.username?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {onlineUser.displayName || onlineUser.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            Level {onlineUser.level}
                          </p>
                        </div>
                        {teams.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleInviteUser(onlineUser.id, teams[0].id)}
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        )}
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invitations */}
          {invitations.length > 0 && (
            <Card className="border-0 shadow-sm mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Pending invitations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{invitation.team.name}</h4>
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                          New
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        Invited by {invitation.inviter.displayName}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={() => handleRespondToInvitation(invitation.id, 'ACCEPTED')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleRespondToInvitation(invitation.id, 'REJECTED')}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">Mission Master</h1>
          <p className="text-gray-600">Team task management simplified</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-600">
              {onlineUsers.length} users online
            </span>
          </div>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-light">Welcome</CardTitle>
            <CardDescription>
              Sign in to manage your team tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username or email</Label>
                    <Input
                      id="login-username"
                      name="username"
                      type="text"
                      placeholder="Enter your username or email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      name="username"
                      type="text"
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-displayName">Display name</Label>
                    <Input
                      id="register-displayName"
                      name="displayName"
                      type="text"
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email (optional)</Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="Choose a password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}