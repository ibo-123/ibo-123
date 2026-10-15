import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import tripService from "@/services/tripService";
import { apiErrorMessage } from "@/services/api";

export function BookTripDialog() {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [cargo, setCargo] = useState("");
  const [weight, setWeight] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      tripService.startTrip({
        destination: {
          label: destination,
          ...(lat ? { lat: Number(lat) } : {}),
          ...(lng ? { lng: Number(lng) } : {}),
        },
        cargo,
        ...(weight ? { weightKg: Number(weight) } : {}),
      }),
    onSuccess: (trip) => {
      toast.success(`Shipment booked — ${trip.tripId}`, {
        description: "Save this Trip ID to track your delivery.",
      });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setOpen(false);
      setDestination("");
      setCargo("");
      setWeight("");
      setLat("");
      setLng("");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not book this shipment")),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          Book shipment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a shipment</DialogTitle>
          <DialogDescription>
            Dispatch assigns the nearest available driver and the backend generates your Trip ID.
          </DialogDescription>
        </DialogHeader>

        <form
          id="book-trip"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!destination.trim()) {
              toast.error("Enter a destination");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Adama warehouse, Oromia"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude (optional)</Label>
              <Input
                id="lat"
                inputMode="decimal"
                value={lat}
                onChange={(event) => setLat(event.target.value)}
                placeholder="8.5400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude (optional)</Label>
              <Input
                id="lng"
                inputMode="decimal"
                value={lng}
                onChange={(event) => setLng(event.target.value)}
                placeholder="39.2675"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo description</Label>
            <Textarea
              id="cargo"
              value={cargo}
              onChange={(event) => setCargo(event.target.value)}
              placeholder="40 pallets of bottled water"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              inputMode="numeric"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="12000"
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form="book-trip" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Book shipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BookTripDialog;
