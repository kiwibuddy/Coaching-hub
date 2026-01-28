import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import type { ClientProfile } from "@shared/schema";
import { Users, Search, ArrowRight } from "lucide-react";
import { useState } from "react";

// Extended type with user data from the API
type ClientProfileWithUser = ClientProfile & {
  user?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export default function CoachClients() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: clients, isLoading } = useQuery<ClientProfileWithUser[]>({
    queryKey: ["/api/coach/clients"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  // Helper to get display name for a client
  const getClientName = (client: ClientProfileWithUser) => {
    if (client.user?.firstName && client.user?.lastName) {
      return `${client.user.firstName} ${client.user.lastName}`;
    }
    if (client.user?.email) {
      return client.user.email;
    }
    return `Client #${client.id.slice(0, 8)}`;
  };

  const filteredClients = clients?.filter((client) => {
    const clientName = getClientName(client).toLowerCase();
    const matchesSearch = 
      clientName.includes(search.toLowerCase()) ||
      client.goals?.toLowerCase().includes(search.toLowerCase()) ||
      client.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      client.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your coaching clients.
          </p>
        </div>
        <Link href="/coach/intake">
          <Button data-testid="button-view-intake">
            View Intake Requests
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      {filteredClients && filteredClients.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Goals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover-elevate">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{getClientName(client)}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.user?.email || client.preferredContactMethod || "No email"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                      {client.goals || "No goals specified"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "active"
                          ? "default"
                          : client.status === "paused"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(client.createdAt!), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/coach/clients/${client.id}`}>
                      <Button variant="ghost" size="sm" data-testid={`button-view-client-${client.id}`}>
                        View
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title={search || filterStatus !== "all" ? "No clients found" : "No clients yet"}
              description={
                search || filterStatus !== "all"
                  ? "Try adjusting your search or filters."
                  : "Accept intake requests to add new clients."
              }
              actionLabel="View Intake Requests"
              onAction={() => (window.location.href = "/coach/intake")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
