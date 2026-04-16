import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Search, User, MessageCircle, Tag, TrendingUp, Filter, 
  Loader2, Plus, MoreVertical, Edit, Trash2, Phone, Mail,
  MessageSquare
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/DashboardLayout";

export default function Contacts() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    displayName: "",
    email: "",
    segment: "",
    notes: "",
  });

  const utils = trpc.useContext();
  const { data: contacts, isLoading } = trpc.whatsapp.getContacts.useQuery();

  const getOrCreateConversationMutation = trpc.whatsapp.getOrCreateConversation.useMutation({
    onSuccess: (conversation) => {
      setLocation(`/conversations?id=${conversation.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start conversation");
    },
  });

  const handleStartConversation = (contact: any) => {
    getOrCreateConversationMutation.mutate({
      contactId: contact.id,
      phoneNumber: contact.phoneNumber,
    });
  };

  const createContactMutation = trpc.whatsapp.createContact.useMutation({
    onSuccess: () => {
      toast.success("Contact created successfully");
      setIsCreateOpen(false);
      utils.whatsapp.getContacts.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create contact");
    },
  });

  const updateContactMutation = trpc.whatsapp.updateContact.useMutation({
    onSuccess: () => {
      toast.success("Contact updated successfully");
      setIsEditOpen(false);
      utils.whatsapp.getContacts.invalidate();
      setEditingContact(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update contact");
    },
  });

  const deleteContactMutation = trpc.whatsapp.deleteContact.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted successfully");
      utils.whatsapp.getContacts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete contact");
    },
  });

  const syncToZohoMutation = trpc.zoho.syncContact.useMutation({
    onSuccess: () => {
      toast.success("Contact synced to Zoho CRM successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sync contact to Zoho CRM");
    }
  });

  const { data: zohoConfig } = trpc.zoho.getConfig.useQuery();

  const resetForm = () => {
    setFormData({
      phoneNumber: "",
      displayName: "",
      email: "",
      segment: "",
      notes: "",
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phoneNumber) {
      toast.error("Phone number is required");
      return;
    }
    createContactMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    updateContactMutation.mutate({
      contactId: editingContact.id,
      ...formData,
    });
  };

  const openEditDialog = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      phoneNumber: contact.phoneNumber,
      displayName: contact.displayName || "",
      email: contact.email || "",
      segment: contact.segment || "",
      notes: contact.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (contactId: number) => {
    setContactToDelete(contactId);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate({ contactId: contactToDelete });
      setIsDeleteOpen(false);
      setContactToDelete(null);
    }
  };

  const filteredContacts = contacts?.filter(contact => {
    const matchesSearch = 
      contact.phoneNumber.includes(searchQuery) || 
      (contact.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSegment = !selectedSegment || contact.segment === selectedSegment;
    
    return matchesSearch && matchesSegment;
  }) || [];

  const segments = Array.from(new Set(contacts?.map(c => c.segment).filter(Boolean))) as string[];

  return (
    <DashboardLayout 
      title="Contacts" 
      subtitle="Manage your customer relationships and segments"
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Enter the details of the new contact.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input 
                  id="phoneNumber" 
                  placeholder="e.g. 1234567890" 
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <Input 
                  id="displayName" 
                  placeholder="e.g. John Doe" 
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segment">Segment</Label>
                <Input 
                  id="segment" 
                  placeholder="e.g. VIP, Lead, Customer" 
                  value={formData.segment}
                  onChange={(e) => setFormData({...formData, segment: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Any additional information..." 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#25D366] hover:bg-[#128C7E]" disabled={createContactMutation.isPending}>
                  {createContactMutation.isPending ? "Creating..." : "Create Contact"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone or email..."
              className="pl-9 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#25D366]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Button
              variant={!selectedSegment ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSegment(null)}
              className={!selectedSegment ? "bg-[#25D366] hover:bg-[#128C7E]" : "text-slate-500 hover:bg-slate-50"}
            >
              All
            </Button>
            {segments.map(segment => (
              <Button
                key={segment}
                variant={selectedSegment === segment ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSegment(segment)}
                className={selectedSegment === segment ? "bg-[#25D366] hover:bg-[#128C7E]" : "text-slate-500 hover:bg-slate-50"}
              >
                {segment}
              </Button>
            ))}
          </div>
        </div>

        {/* Contacts Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No contacts found</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-1">
              {searchQuery ? "Try adjusting your search or filters." : "Start by adding your first contact manually."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredContacts.map(contact => (
              <Card key={contact.id} className="p-5 hover:shadow-md transition-all border-slate-100 group relative">
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {zohoConfig?.refreshToken && (
                        <DropdownMenuItem onClick={() => syncToZohoMutation.mutate({ contactId: contact.id })}>
                          <img src="https://www.vectorlogo.zone/logos/zoho/zoho-icon.svg" className="w-4 h-4 mr-2" alt="Zoho" />
                          Sync to Zoho CRM
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(contact.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-col h-full">
                  <Link href={`/contacts/${contact.id}`}>
                    <div className="flex items-center gap-4 cursor-pointer mb-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 group-hover:bg-[#DCF8C6]/50 transition">
                        <User className="w-7 h-7 text-slate-400 group-hover:text-[#075E54]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate group-hover:text-[#25D366] transition-colors">
                          {contact.displayName || contact.phoneNumber}
                        </h4>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {contact.phoneNumber}
                        </p>
                        {contact.email && (
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] py-0 h-5 border-slate-200 text-slate-500">
                        Score: {contact.leadScore}
                      </Badge>
                      {contact.segment && (
                        <Badge className="text-[10px] py-0 h-5 bg-blue-50 text-blue-700 border-none">
                          {contact.segment}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {zohoConfig?.refreshToken && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-blue-500 hover:bg-blue-50 p-2 h-8 w-8 rounded-full"
                          onClick={() => syncToZohoMutation.mutate({ contactId: contact.id })}
                          disabled={syncToZohoMutation.isPending}
                        >
                          <img src="https://www.vectorlogo.zone/logos/zoho/zoho-icon.svg" className="w-4 h-4" alt="Zoho" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-[#25D366] hover:text-[#128C7E] hover:bg-[#DCF8C6]/50 p-2 h-8 w-8 rounded-full"
                        onClick={() => handleStartConversation(contact)}
                        disabled={getOrCreateConversationMutation.isPending}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update the details for {editingContact?.displayName || editingContact?.phoneNumber}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phoneNumber">Phone Number *</Label>
              <Input 
                id="edit-phoneNumber" 
                disabled
                value={formData.phoneNumber}
              />
              <p className="text-[10px] text-slate-400">Phone number cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-displayName">Name</Label>
              <Input 
                id="edit-displayName" 
                placeholder="e.g. John Doe" 
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input 
                id="edit-email" 
                type="email" 
                placeholder="john@example.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-segment">Segment</Label>
              <Input 
                id="edit-segment" 
                placeholder="e.g. VIP, Lead, Customer" 
                value={formData.segment}
                onChange={(e) => setFormData({...formData, segment: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea 
                id="edit-notes" 
                placeholder="Any additional information..." 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#25D366] hover:bg-[#128C7E]" disabled={updateContactMutation.isPending}>
                {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
