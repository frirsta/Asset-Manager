import { useState } from "react";
import { 
  useListContacts, 
  getListContactsQueryKey, 
  useListCategories,
  useBulkDeleteContacts,
  useCreateContact
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Upload, Trash2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const contactSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
  contactName: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Debounce search
  import("react").then((React) => {
    React.useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(search), 500);
      return () => clearTimeout(timer);
    }, [search]);
  });

  const queryParams = {
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status: status as any } : {}),
  };

  const { data: contactsData, isLoading } = useListContacts(queryParams);
  const { data: categories = [] } = useListCategories();
  const bulkDelete = useBulkDeleteContacts();
  const createContact = useCreateContact();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      companyName: "",
      email: "",
      contactName: "",
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && contactsData?.contacts) {
      setSelectedIds(contactsData.contacts.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    bulkDelete.mutate({ data: { ids: selectedIds } }, {
      onSuccess: (result) => {
        toast({
          title: "Contacts deleted",
          description: `Successfully deleted ${result.deleted} contacts.`,
        });
        setSelectedIds([]);
        queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to delete",
          description: err.message || "An error occurred.",
          variant: "destructive"
        });
      }
    });
  };

  const onSubmitCreate = (data: ContactFormValues) => {
    createContact.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Contact created successfully" });
        setIsCreateOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to create contact",
          description: err.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
    
    try {
      const response = await fetch(`${BASE_URL}/api/contacts/import`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Import complete",
          description: `Imported ${result.imported} contacts. Skipped ${result.skipped}.`,
        });
        queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
      } else {
        throw new Error(result.error || "Failed to import");
      }
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const allSelected = contactsData?.contacts?.length > 0 && selectedIds.length === contactsData.contacts.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleBulkDelete}
              disabled={bulkDelete.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedIds.length}
            </Button>
          )}
          
          <div className="relative">
            <input 
              type="file" 
              accept=".csv,.xlsx" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImport}
              disabled={isImporting}
            />
            <Button variant="outline" disabled={isImporting}>
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@acme.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createContact.isPending}>
                      {createContact.isPending ? "Saving..." : "Save Contact"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 border rounded-lg shadow-sm">
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search company or email..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={categoryId?.toString() || "all"} onValueChange={(v) => setCategoryId(v === "all" ? null : parseInt(v))}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 opacity-50" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? null : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] px-4">
                <Checkbox 
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                </TableCell>
              </TableRow>
            ) : !contactsData?.contacts?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              contactsData.contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="px-4">
                    <Checkbox 
                      checked={selectedIds.includes(contact.id)}
                      onCheckedChange={(checked) => handleSelectOne(contact.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/contacts/${contact.id}`} className="hover:underline">
                      {contact.companyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{contact.email}</span>
                      {contact.contactName && (
                        <span className="text-xs text-muted-foreground">{contact.contactName}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.categoryName ? (
                      <Badge variant="secondary" className="font-normal">{contact.categoryName}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      contact.status === 'sent' ? 'default' : 
                      contact.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {contactsData && contactsData.total > queryParams.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * queryParams.limit + 1} to {Math.min(page * queryParams.limit, contactsData.total)} of {contactsData.total} entries
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page * queryParams.limit >= contactsData.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
