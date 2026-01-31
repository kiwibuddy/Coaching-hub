import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpload } from "@/hooks/use-upload";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Resource, ClientProfile } from "@shared/schema";
import { FileText, Upload, Plus, Search, Download, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  clientId: z.string().optional(),
  isGlobal: z.boolean().default(false),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

export default function CoachResources() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      console.log("File uploaded:", response.objectPath);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/coach/resources"],
  });

  const { data: clients } = useQuery<ClientProfile[]>({
    queryKey: ["/api/coach/clients"],
  });

  // Helper to get display name for a client
  const getClientName = (client: any) => {
    const user = client.user;
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.email || `Client #${client.id.slice(0, 8)}`;
  };

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      clientId: "",
      isGlobal: false,
    },
  });

  const createResource = useMutation({
    mutationFn: async (data: ResourceFormValues & { fileUrl?: string; fileType?: string; fileName?: string }) => {
      return apiRequest("POST", "/api/coach/resources", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/resources"] });
      toast({
        title: "Resource Created",
        description: "The resource has been added successfully.",
      });
      form.reset();
      setSelectedFile(null);
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/coach/resources/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/resources"] });
      toast({
        title: "Resource Deleted",
        description: "The resource has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete resource.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: ResourceFormValues) => {
    let fileUrl = "";
    let fileType = "";
    let fileName = "";

    if (selectedFile) {
      const uploadResult = await uploadFile(selectedFile);
      if (uploadResult) {
        fileUrl = uploadResult.objectPath;
        fileType = selectedFile.type.split("/")[1] || "file";
        fileName = selectedFile.name;
      }
    }

    createResource.mutate({
      ...data,
      fileUrl,
      fileType,
      fileName,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <TableSkeleton />
      </div>
    );
  }

  const filteredResources = resources?.filter((resource) =>
    resource.title.toLowerCase().includes(search.toLowerCase()) ||
    resource.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">
            Manage coaching materials and documents.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button
            type="button"
            data-testid="button-add-resource"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Resource</DialogTitle>
              <DialogDescription>
                Upload a new resource for your clients.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Goal Setting Worksheet" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of the resource..." {...field} data-testid="textarea-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>File</FormLabel>
                  <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      data-testid="input-file"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      {selectedFile ? (
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Click to upload a file
                        </p>
                      )}
                    </label>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Client (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-client">
                            <SelectValue placeholder="Select a client (or leave empty for all)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All clients</SelectItem>
                          {(clients ?? []).filter((c) => c.status === "active").map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {getClientName(client)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isGlobal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-global"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Make available to all clients</FormLabel>
                        <FormDescription>
                          This resource will be visible in every client's resource library.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createResource.isPending || isUploading}
                    data-testid="button-submit-resource"
                  >
                    {createResource.isPending || isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isUploading ? `Uploading... ${progress}%` : "Saving..."}
                      </>
                    ) : (
                      "Add Resource"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      {filteredResources && filteredResources.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover-elevate">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-medium truncate">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      {resource.isGlobal && (
                        <Badge variant="secondary" className="text-xs">
                          Global
                        </Badge>
                      )}
                      {resource.fileType && (
                        <Badge variant="outline" className="text-xs uppercase">
                          {resource.fileType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {resource.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                      data-testid={`button-download-${resource.id}`}
                    >
                      <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteResource.mutate(resource.id)}
                    data-testid={`button-delete-${resource.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title={search ? "No resources found" : "No resources yet"}
              description={
                search
                  ? "Try adjusting your search."
                  : "Add resources to share with your clients."
              }
              actionLabel="Add Resource"
              onAction={() => setDialogOpen(true)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
