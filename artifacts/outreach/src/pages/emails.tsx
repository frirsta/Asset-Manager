import { useState } from "react";
import { useListEmails } from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Emails() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | null>(null);

  const queryParams = {
    page,
    limit: 50,
    ...(status ? { status: status as any } : {}),
  };

  const { data, isLoading } = useListEmails(queryParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Log</h1>
          <p className="text-muted-foreground">System-wide record of all outbound emails.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? null : v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                </TableCell>
              </TableRow>
            ) : !data?.emails?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Mail className="h-8 w-8 mb-2 opacity-20" />
                    No emails found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.emails.map((email) => (
                <TableRow key={email.id} className="group">
                  <TableCell>
                    {email.status === 'sent' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{email.contactEmail}</span>
                      {email.contactCompany && (
                        <span className="text-xs text-muted-foreground">{email.contactCompany}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {email.campaignId ? (
                      <Link href={`/campaigns/${email.campaignId}`} className="hover:underline font-medium text-sm">
                        {email.campaignName || `Campaign #${email.campaignId}`}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant={email.status === 'sent' ? 'default' : 'destructive'}>
                        {email.status}
                      </Badge>
                      {email.errorMessage && (
                        <span className="text-[10px] text-destructive max-w-[200px] truncate" title={email.errorMessage}>
                          {email.errorMessage}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(email.sentAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total > queryParams.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * queryParams.limit + 1} to {Math.min(page * queryParams.limit, data.total)} of {data.total} records
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
              disabled={page * queryParams.limit >= data.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
