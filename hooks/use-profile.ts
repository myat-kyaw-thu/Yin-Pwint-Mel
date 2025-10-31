import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProfile, type UpdateProfileInput } from "@/lib/actions/profile.actions"
import { toast } from "@/hooks/use-toast"

export function useUpdateProfile(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Update the profile cache immediately
      queryClient.setQueryData(["profile"], data)
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })
      
      // Call the callback
      if (onSuccess) {
        onSuccess()
      }
    },
    onError: (error) => {
      console.error("Failed to update profile:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    },
  })
}
