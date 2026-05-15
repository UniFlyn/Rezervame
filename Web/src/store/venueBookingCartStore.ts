import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CartState = {
  businessId: string | null;
  serviceIds: string[];
  setCart: (businessId: string, serviceIds: string[]) => void;
  removeService: (businessId: string, serviceId: string) => void;
  clear: () => void;
};

/**
 * Remembers which services are selected for booking while browsing venues.
 * If the customer opens another business and adds a service, the UI can offer to replace this cart.
 */
export const useVenueBookingCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      businessId: null,
      serviceIds: [],
      setCart: (businessId, serviceIds) => set({ businessId, serviceIds }),
      removeService: (businessId, serviceId) => {
        const st = get();
        if (st.businessId !== businessId) return;
        const index = st.serviceIds.indexOf(serviceId);
        if (index === -1) return;
        const next = [...st.serviceIds];
        next.splice(index, 1);
        if (next.length === 0) set({ businessId: null, serviceIds: [] });
        else set({ serviceIds: next });
      },
      clear: () => set({ businessId: null, serviceIds: [] }),
    }),
    {
      name: "rezervame-venue-booking-cart",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        businessId: state.businessId,
        serviceIds: state.serviceIds,
      }),
    },
  ),
);
