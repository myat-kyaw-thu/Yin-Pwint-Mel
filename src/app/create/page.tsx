"use client";

import type React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Tag, X } from "lucide-react";
import { nanoid } from "nanoid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import HomeLayout from "@/components/layout/home-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { blogController } from "@/controller/blogController";
import { userController, type User } from "@/controller/userController";
import { useToast } from "@/hook/use-toast";

// Validation schema for blog creation
const blogSchema = z.object({
  title: z
    .string()
    .min(3, {
      message: "Title must be at least 3 characters.",
    })
    .max(100, {
      message: "Title must not exceed 100 characters.",
    }),
  subtitle: z
    .string()
    .max(150, {
      message: "Subtitle must not exceed 150 characters.",
    })
    .optional(),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(500, {
      message: "Description must not exceed 500 characters.",
    }),
  content: z.string().min(50, {
    message: "Content must be at least 50 characters.",
  }),
  tags: z.string().optional(),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "ONLY_ME"]).default("PUBLIC"),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export default function CreateBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<
    { id: string; file: File; preview: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form
  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      content: "",
      tags: "",
      visibility: "PUBLIC",
    },
  });

  // Fetch user data when session is available
  useEffect(() => {
    async function fetchUserData() {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const userData = await userController.getUserByEmail(
            session.user.email
          );
          setUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to load user data",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        router.push("/auth/login");
      }
    }

    fetchUserData();
  }, [session, status, router, toast]);

  // Handle image selection
  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map((file) => ({
      id: nanoid(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images as per schema

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove image
  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      // Revoke object URL to avoid memory leaks
      const removed = prev.find((img) => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
  };

  // Handle form submission
  const onSubmit = async (data: BlogFormValues) => {
    if (images.length === 0) {
      toast({
        title: "Image Required",
        description: "Please add at least one image to your blog post",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "User data not available",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Process tags
      const tagList = data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== "")
        : [];

      // Upload images and get URLs
      const imageUrls = await Promise.all(
        images.map(async (img) => {
          // Create a FormData object to upload the file
          const formData = new FormData();
          formData.append("file", img.file);

          // Upload the file to the server
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            headers: {
              "x-user-id": user.id,
              "x-user-username": user.username,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to upload image");
          }

          const data = await response.json();
          return data.url; // Return the URL of the uploaded image
        })
      );

      // Create blog post
      const blogData = {
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description,
        content: data.content,
        visibility: data.visibility,
        images: imageUrls,
        tags: tagList,
      };

      const result = await blogController.createBlog(
        blogData,
        user.id,
        user.username
      );

      if (result) {
        toast({
          title: "Success",
          description: "Blog post created successfully",
        });

        // Redirect to the new blog post
        router.push(`/blog/${result.id}`);
      } else {
        throw new Error("Failed to create blog post");
      }
    } catch (error) {
      console.error("Error creating blog post:", error);
      toast({
        title: "Error",
        description: "Failed to create blog post",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  // Don't render the layout if user is null
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">
          User data not available
        </div>
      </div>
    );
  }

  return (
    <HomeLayout user={user}>
      <div className="max-w-3xl mx-auto">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-center">
              Create New Blog Post
            </CardTitle>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6 pt-6">
                {/* Image Upload Section */}
                <div className="space-y-2">
                  <FormLabel>Images (Max 5)</FormLabel>
                  <div
                    className={`border-2 border-dashed rounded-md p-6 text-center ${
                      images.length > 0 ? "border-gray-200" : "border-gray-300"
                    }`}
                  >
                    {images.length === 0 ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ImagePlus className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-500">
                          Drag photos here or click to upload
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleImageSelect}
                        >
                          Select from computer
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((img) => (
                          <div
                            key={img.id}
                            className="relative group aspect-square"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.preview || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {images.length < 5 && (
                          <button
                            type="button"
                            onClick={handleImageSelect}
                            className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md aspect-square hover:bg-gray-50 transition-colors"
                          >
                            <ImagePlus className="h-8 w-8 text-gray-400" />
                          </button>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    You can upload up to 5 images
                  </p>
                </div>

                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a catchy title"
                          {...field}
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subtitle */}
                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Add a subtitle"
                          {...field}
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write a brief description of your blog post"
                          {...field}
                          className="border-gray-300 focus:border-blue-500 resize-none h-20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your blog post content here..."
                          {...field}
                          className="border-gray-300 focus:border-blue-500 resize-none h-40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Tags</FormLabel>
                        <Tag className="h-4 w-4 text-gray-500" />
                      </div>
                      <FormControl>
                        <Input
                          placeholder="Enter tags separated by commas (e.g. travel, food, lifestyle)"
                          {...field}
                          className="border-gray-300 focus:border-blue-500"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        Tags help others discover your content
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Visibility */}
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="PUBLIC">
                            Public - Anyone can see this post
                          </option>
                          <option value="FOLLOWERS">
                            Followers Only - Only your followers can see this
                            post
                          </option>
                          <option value="ONLY_ME">
                            Private - Only you can see this post
                          </option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-end gap-2 p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? "Publishing..." : "Publish Post"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </HomeLayout>
  );
}
