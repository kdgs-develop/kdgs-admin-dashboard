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
import { toast, useToast } from '@/hooks/use-toast';
import { Edit2, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createGenealogist,
  deleteGenealogist,
  getGenealogists,
  updateGenealogist,
  updateGenealogistPassword
} from './actions';
import { SendEmailComponent } from './send-email-component';

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
  const [role, setRole] = useState('VIEWER');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [editingGenealogist, setEditingGenealogist] =
    useState<Genealogist | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [emailDetails, setEmailDetails] = useState<{
    to: string;
    name: string;
    password: string;
    role: string;
    isResend: boolean;
  } | null>(null);

  const fetchGenealogists = async () => {
    try {
      const fetchedGenealogists = await getGenealogists();
      setGenealogists(fetchedGenealogists);
    } catch (error) {
      console.error('Error fetching genealogists:', error);
      toast({ title: 'Error fetching genealogists', variant: 'destructive' });
    }
  };

  const handleCreateGenealogist = async () => {
    try {
      const newPassword = generateSecurePassword();
      const newGenealogist = {
        email: email,
        fullName: firstName + ' ' + lastName,
        phone: phone,
        role: role, // Use the selected role
      };
      await createGenealogist({
        firstName,
        lastName,
        email,
        phone,
        role: role, // Use the selected role
        password: newPassword,
      });
      await sendWelcomeEmail(newGenealogist, newPassword);
      toast({ title: 'Genealogist created successfully' });
      fetchGenealogists();
      resetForm();
    } catch (error) {
      toast({ 
        title: 'Error creating genealogist', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
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
    return password;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('VIEWER'); // Reset to 'VIEWER'
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
    genealogist:  Partial<Genealogist>,
    password: string,
    isResend: boolean = false
  ) => {
    setEmailDetails({
      to: genealogist.email!,
      name: genealogist.fullName!,
      password,
      role: genealogist.role!,
      isResend
    });

    if (isResend) {
      await updateGenealogistPassword(genealogist?.id!, password);
    }
  };

  const handleResendPassword = async (genealogist: Genealogist) => {
    const newPassword = generateSecurePassword();
    await sendWelcomeEmail(genealogist, newPassword, true);
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
        <Select value={role} onValueChange={setRole} defaultValue="VIEWER">
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
                          disabled={genealogist.email === "kdgs.develop@gmail.com"}
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
                      disabled={genealogist.email === "kdgs.develop@gmail.com"}
                    >
                      Resend Password
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteGenealogist(genealogist.id)}
                      disabled={genealogist.email === "kdgs.develop@gmail.com"}
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
      {emailDetails && (
        <SendEmailComponent
          to={emailDetails.to}
          name={emailDetails.name}
          password={emailDetails.password}
          role={emailDetails.role}
          isResend={emailDetails.isResend}
        />
      )}
    </div>
  );
}