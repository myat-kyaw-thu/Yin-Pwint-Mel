import { useMutation } from "@tanstack/react-query"
import { updateProfile, type UpdateProfileInput } from "@/lib/actions/profile.actions"
import { toast } from "@/hooks/use-toast"
import type { Profile } from "@/types/database"

export function useUpdateProfile(onSuccess?: (profile: Profile) => void) {
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })
      
      if (onSuccess && data) {
        onSuccess(data)
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
