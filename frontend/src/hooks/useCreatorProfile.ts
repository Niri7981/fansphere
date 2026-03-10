import { ApiService } from "@/services/api.service";
import { useQuery } from "@tanstack/react-query";

export function useCreatorProfile(address: string) {
    return useQuery({
        queryKey: ['creator', address],

        queryFn: async () => {
            const response = await ApiService.getCreatorProfile(address);
            return response;
        },

        enabled: !!address,

    })
}