import { useListCampaigns, getListCampaignsQueryKey, useDeleteCampaign } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Trash2, Mail, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function Campaigns() {
  const { data: campaigns, isLoading } = useListCampaigns();
  const deleteCampaign = useDeleteCampaign();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault(); // prevent navigation
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;
    
    deleteCampaign.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Campaign deleted" });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage your outreach sequences.</p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-[250px] mb-4" />
                <Skeleton className="h-4 w-[150px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Send className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No campaigns</h3>
          <p className="mt-2 mb-4 text-sm text-muted-foreground">
            Create a campaign to start sending targeted outreach.
          </p>
          <Button asChild>
            <Link href="/campaigns/new">Create Campaign</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns?.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        <Badge variant={
                          campaign.status === 'sent' ? 'default' : 
                          campaign.status === 'sending' ? 'secondary' :
                          campaign.status === 'draft' ? 'outline' : 'destructive'
                        }>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {campaign.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {campaign.categoryName || 'Uncategorized'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2 md:w-64 shrink-0">
                      <div className="flex items-center justify-between w-full md:justify-end gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Sent</span>
                          <span className="font-medium">{campaign.sentCount} / {campaign.totalCount}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                          onClick={(e) => handleDelete(e, campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Progress 
                        value={campaign.totalCount > 0 ? (campaign.sentCount / campaign.totalCount) * 100 : 0} 
                        className="h-2 w-full" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
