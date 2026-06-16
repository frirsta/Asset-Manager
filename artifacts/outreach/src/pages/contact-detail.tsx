import { useParams } from "wouter";
import { useGetContact, getGetContactQueryKey, useUpdateContact } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Globe, Mail, MapPin, Phone, Building, Save } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function ContactDetail() {
  const { id } = useParams();
  const contactId = id ? parseInt(id) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: detailData, isLoading, isError } = useGetContact(contactId, { 
    query: { enabled: !!contactId, queryKey: getGetContactQueryKey(contactId) } 
  });
  
  const updateContact = useUpdateContact();
  
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    industry: "",
    city: "",
    country: "",
    phone: "",
    notes: ""
  });

  useEffect(() => {
    if (detailData?.contact) {
      const c = detailData.contact;
      setFormData({
        companyName: c.companyName || "",
        contactName: c.contactName || "",
        email: c.email || "",
        website: c.website || "",
        industry: c.industry || "",
        city: c.city || "",
        country: c.country || "",
        phone: c.phone || "",
        notes: c.notes || ""
      });
    }
  }, [detailData]);

  const handleSave = () => {
    updateContact.mutate({ id: contactId, data: formData }, {
      onSuccess: () => {
        toast({ title: "Contact updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetContactQueryKey(contactId) });
      },
      onError: (err: any) => {
        toast({ 
          title: "Failed to update", 
          description: err.message, 
          variant: "destructive" 
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[400px] md:col-span-1" />
          <Skeleton className="h-[400px] md:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !detailData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-semibold">Contact not found</h2>
        <Button asChild variant="outline">
          <Link href="/contacts">Back to Contacts</Link>
        </Button>
      </div>
    );
  }

  const { contact, emails } = detailData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/contacts"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{contact.companyName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={
              contact.status === 'sent' ? 'default' : 
              contact.status === 'failed' ? 'destructive' : 'outline'
            }>
              {contact.status}
            </Badge>
            {contact.categoryName && (
              <Badge variant="secondary">{contact.categoryName}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="companyName" 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="pl-9" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input 
                  id="contactName" 
                  value={formData.contactName}
                  onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                  placeholder="e.g. Jane Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-9" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="website" 
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="pl-9" 
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="pl-9" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input 
                    id="country" 
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                className="w-full mt-2" 
                onClick={handleSave}
                disabled={updateContact.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateContact.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="history">
            <TabsList className="mb-4">
              <TabsTrigger value="history">Email History</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Log</CardTitle>
                  <CardDescription>All campaigns sent to this contact.</CardDescription>
                </CardHeader>
                <CardContent>
                  {emails && emails.length > 0 ? (
                    <div className="space-y-4">
                      {emails.map((email) => (
                        <div key={email.id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-lg gap-4 bg-muted/20">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{email.campaignName}</span>
                              <Badge variant={email.status === 'sent' ? 'default' : 'destructive'} className="text-[10px] px-1 py-0 h-4">
                                {email.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {email.contactEmail}
                            </div>
                            {email.errorMessage && (
                              <p className="text-xs text-destructive mt-2 bg-destructive/10 p-2 rounded">
                                Error: {email.errorMessage}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground sm:text-right whitespace-nowrap">
                            {new Date(email.sentAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center border rounded-lg border-dashed text-muted-foreground">
                      No emails sent to this contact yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Private Notes</CardTitle>
                  <CardDescription>Information not visible to the prospect.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Add notes about this prospect here..." 
                    className="min-h-[300px] resize-y"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSave} disabled={updateContact.isPending}>
                      Save Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
