import { useParams, Link } from "wouter";
import { useGetCampaign, getGetCampaignQueryKey, useSendCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, AlertCircle, FileText, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CampaignDetail() {
  const { id } = useParams();
  const campaignId = id ? parseInt(id) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: detailData, isLoading, isError } = useGetCampaign(campaignId, { 
    query: { enabled: !!campaignId, queryKey: getGetCampaignQueryKey(campaignId) } 
  });
  
  const sendCampaign = useSendCampaign();

  const handleSend = () => {
    if (!confirm("Are you sure you want to send this campaign? This will start sending emails immediately.")) return;
    
    sendCampaign.mutate({ id: campaignId }, {
      onSuccess: (result) => {
        toast({ 
          title: "Campaign started", 
          description: `Queued ${result.total} emails.` 
        });
        queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId) });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      },
      onError: (err: any) => {
        toast({ 
          title: "Failed to send", 
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
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[200px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !detailData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-semibold">Campaign not found</h2>
        <Button asChild variant="outline">
          <Link href="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  const { campaign, emails } = detailData;
  const isDraft = campaign.status === 'draft';
  const progressValue = campaign.totalCount > 0 ? (campaign.sentCount / campaign.totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/campaigns"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              {campaign.name}
              <Badge variant={
                campaign.status === 'sent' ? 'default' : 
                campaign.status === 'sending' ? 'secondary' :
                isDraft ? 'outline' : 'destructive'
              }>
                {campaign.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Targeting: <span className="font-medium text-foreground">{campaign.categoryName}</span>
            </p>
          </div>
        </div>
        
        {isDraft && (
          <Button 
            onClick={handleSend} 
            disabled={sendCampaign.isPending || campaign.totalCount === 0}
            size="lg"
            className="gap-2"
          >
            <Play className="h-4 w-4 fill-current" />
            {sendCampaign.isPending ? "Sending..." : "Send Campaign"}
          </Button>
        )}
      </div>

      {campaign.totalCount === 0 && isDraft && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No contacts</AlertTitle>
          <AlertDescription>
            The selected category "{campaign.categoryName}" has no contacts. Add contacts to this category before sending.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Subject</span>
                <p className="text-base font-medium bg-muted/30 p-3 rounded-md mt-1 border">
                  {campaign.subject}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Body</span>
                <div className="bg-muted/30 p-4 rounded-md mt-1 border whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {campaign.body}
                </div>
              </div>
            </CardContent>
          </Card>

          {!isDraft && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Log</CardTitle>
                <CardDescription>Individual message status</CardDescription>
              </CardHeader>
              <CardContent>
                {emails && emails.length > 0 ? (
                  <div className="space-y-3">
                    {emails.map(email => (
                      <div key={email.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                        <div className="flex items-center gap-3">
                          {email.status === 'sent' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          <div>
                            <div className="font-medium text-sm">{email.contactEmail}</div>
                            {email.contactCompany && (
                              <div className="text-xs text-muted-foreground">{email.contactCompany}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {email.errorMessage && (
                            <div className="text-xs text-destructive max-w-[200px] truncate" title={email.errorMessage}>
                              {email.errorMessage}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {new Date(email.sentAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Logs will appear here once emails are processed.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-2xl font-bold">{campaign.totalCount}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Audience</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{campaign.sentCount}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Delivered</div>
                </div>
                {campaign.failedCount > 0 && (
                  <div className="col-span-2">
                    <div className="text-2xl font-bold text-destructive">{campaign.failedCount}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Failed</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
              {campaign.sentAt && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="font-medium">{new Date(campaign.sentAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground">Category ID</span>
                <span className="font-medium font-mono">{campaign.categoryId}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
