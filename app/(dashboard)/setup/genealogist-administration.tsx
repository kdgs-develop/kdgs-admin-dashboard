'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createGenealogist,
  deleteGenealogist,
  getGenealogists,
  updateGenealogist,
  updateGenealogistPassword
} from './actions';

interface Genealogist {
  id: number;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string | null;
}

export function GeneaologistAdministration() {
  const [genealogists, setGenealogists] = useState<Genealogist[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [editingGenealogist, setEditingGenealogist] =
    useState<Genealogist | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchGenealogists = async () => {
    try {
      console.log('Fetching genealogists...');
      const fetchedGenealogists = await getGenealogists();
      console.log('Fetched genealogists:', fetchedGenealogists);
      setGenealogists(fetchedGenealogists);
    } catch (error) {
      console.error('Error fetching genealogists:', error);
      toast({ title: 'Error fetching genealogists', variant: 'destructive' });
    }
  };

  const handleCreateGenealogist = async () => {
    try {
      await createGenealogist({
        firstName,
        lastName,
        email,
        phone,
        role,
        password
      });
      toast({ title: 'Genealogist created successfully' });
      fetchGenealogists();
      resetForm();
    } catch (error) {
      toast({ title: 'Error creating genealogist', variant: 'destructive' });
    }
  };

  const handleDeleteGenealogist = async (id: number) => {
    try {
      await deleteGenealogist(id);
      toast({ title: 'Genealogist deleted successfully' });
      fetchGenealogists();
    } catch (error) {
      toast({ title: 'Error deleting genealogist', variant: 'destructive' });
    }
  };

  const generateSecurePassword = () => {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('');
    setPassword('');
  };

  const handleEditGenealogist = async () => {
    if (!editingGenealogist) return;
    try {
      await updateGenealogist({
        id: editingGenealogist.id,
        phone: editPhone,
        role: editRole
      });
      toast({ title: 'Genealogist updated successfully' });
      fetchGenealogists();
      setEditingGenealogist(null);
      setIsEditDialogOpen(false); // Close the dialog
    } catch (error) {
      toast({ title: 'Error updating genealogist', variant: 'destructive' });
    }
  };

  const openEditDialog = (genealogist: Genealogist) => {
    setEditingGenealogist(genealogist);
    setEditPhone(genealogist.phone || '');
    setEditRole(genealogist.role || '');
    setIsEditDialogOpen(true);
  };

  useEffect(() => {
    fetchGenealogists();
  }, []);

  const sendWelcomeEmail = async (
    genealogist: Genealogist,
    newPassword?: string
  ) => {
    try {
      const password = newPassword || (await generateSecurePassword());
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: genealogist.email,
          name: genealogist.fullName,
          password: password,
          isResend: !!newPassword
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from server:', errorData);
        throw new Error(`Failed to send welcome email: ${errorData.error || response.statusText}`);
      }
  
      if (newPassword) {
        await updateGenealogistPassword(genealogist.id, newPassword);
      }
  
      toast({ title: 'Welcome email sent successfully' });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      toast({ 
        title: 'Error sending welcome email', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    }
  };

  const handleResendPassword = async (genealogist: Genealogist) => {
    const newPassword = generateSecurePassword();
    await sendWelcomeEmail(genealogist, newPassword!);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Genealogist Administration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VIEWER">Viewer</SelectItem>
            <SelectItem value="SCANNER">Scanner</SelectItem>
            <SelectItem value="INDEXER">Indexer</SelectItem>
            <SelectItem value="PROOFREADER">Proofreader</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex space-x-2">
          <Button variant={'outline'} onClick={generateSecurePassword}>
            Generate
          </Button>
          <div className="relative flex-grow">
            <Input
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleCreateGenealogist}
          className="w-full md:w-auto"
          variant={'default'}
        >
          Create Genealogist
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {genealogists.map((genealogist) => (
              <TableRow key={genealogist.id}>
                <TableCell>{genealogist.fullName || 'N/A'}</TableCell>
                <TableCell>{genealogist.email}</TableCell>
                <TableCell>{genealogist.phone || 'N/A'}</TableCell>
                <TableCell>{genealogist.role || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog
                      open={isEditDialogOpen}
                      onOpenChange={setIsEditDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(genealogist)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Genealogist</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Input
                            placeholder="Phone"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                          />
                          <Select value={editRole} onValueChange={setEditRole}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                              <SelectItem value="SCANNER">Scanner</SelectItem>
                              <SelectItem value="INDEXER">Indexer</SelectItem>
                              <SelectItem value="PROOFREADER">
                                Proofreader
                              </SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={handleEditGenealogist}>
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendPassword(genealogist)}
                    >
                      Resend Password
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteGenealogist(genealogist.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
