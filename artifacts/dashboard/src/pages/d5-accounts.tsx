import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Shield, Trash2, Edit2, Key, Loader2, Mail, User } from "lucide-react";

interface D5Account {
  id: number;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export default function D5AccountsPage() {
  const { token, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<D5Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<D5Account | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawApiUrl = import.meta.env.VITE_API_URL || "https://apiserver.atozgroupsemarang.com";
  const cleanedApiUrl = rawApiUrl.replace(/["'\r\n\t]+/g, "").trim().replace(/\/$/, "");
  const apiUrl = (!cleanedApiUrl || cleanedApiUrl === "/" || cleanedApiUrl.includes("dashboard.atozgroupsemarang.com")) ? "https://apiserver.atozgroupsemarang.com" : cleanedApiUrl;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/d5-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const err = await res.json();
           throw new Error(err.error || "Failed to fetch users");
        }
        throw new Error(`Server error: ${res.status}. Ensure API is deployed.`);
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast({ title: "Failed to load D5 accounts", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Username and password are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/d5-accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to create user";
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status} ${res.statusText}. Ensure API server is updated and deployed.`;
        }
        throw new Error(errorMsg);
      }

      toast({ title: "D5 account created successfully" });
      setIsCreateOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast({ title: err.message || "Failed to create user", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/d5-accounts/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password: password || undefined }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to update user";
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status} ${res.statusText}. Ensure API server is updated and deployed.`;
        }
        throw new Error(errorMsg);
      }

      toast({ title: "D5 account updated successfully" });
      setIsEditOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast({ title: err.message || "Failed to update user", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this admin user?")) return;

    try {
      const res = await fetch(`${apiUrl}/api/d5-accounts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let errorMsg = "Failed to delete user";
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }

      toast({ title: "D5 account deleted successfully" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: err.message || "Failed to delete user", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setSelectedUser(null);
  };

  const openEdit = (user: D5Account) => {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword("");
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin D5 Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage credentials for the District5-Landing page.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold transition-all">
              <UserPlus className="w-4 h-4 mr-2" />
              Create D5 Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-zinc-800 bg-zinc-900 text-white">
            <DialogHeader>
              <DialogTitle>Create D5 Account</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Register a new account for District5 Landing page.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="create-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-primary"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="create-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-primary"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>District5 Accounts</CardTitle>
          <CardDescription>
            All registered accounts with access to District5 Landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border border-border col-span-full overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead className="hidden md:table-cell">Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No D5 accounts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {admin.username}
                          {admin.id === currentUser?.id && (
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold ml-2">
                              You
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {new Date(admin.createdAt).toLocaleDateString(undefined, {
                            dateStyle: "medium"
                          })}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-accent"
                            onClick={() => openEdit(admin)}
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                            disabled={admin.id === currentUser?.id}
                            onClick={() => handleDelete(admin.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[425px] border-zinc-800 bg-zinc-900 text-white">
          <DialogHeader>
            <DialogTitle>Edit D5 Account</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update password for {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="edit-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-zinc-950 border-zinc-800 text-white focus-visible:ring-primary"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Reset Password (Leave blank to keep current)</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="edit-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-zinc-950 border-zinc-800 text-white focus-visible:ring-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
