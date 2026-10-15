import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  MapPin,
  Radio,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import heroImage from "@/assets/hero-freight.jpg";
import { ROLE_HOME, useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HabeshaFreight — Live freight tracking & dispatch" },
      {
        name: "description",
        content:
          "HabeshaFreight connects shippers, drivers and dispatchers with real-time GPS tracking, smart assignment and fleet analytics across Ethiopia.",
      },
      { property: "og:title", content: "HabeshaFreight — Live freight tracking & dispatch" },
      {
        property: "og:description",
        content:
          "Real-time GPS trip tracking, dispatcher assignment and fleet analytics in one logistics platform.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: Radio,
    title: "Real device GPS",
    body: "Drivers stream their browser's geolocation over Socket.IO. Customers see the truck move — never a simulation.",
  },
  {
    icon: MapPin,
    title: "Live route maps",
    body: "Leaflet maps draw the travelled path, remaining distance and a rolling ETA for every active trip.",
  },
  {
    icon: Users,
    title: "Dispatcher control",
    body: "Assign the nearest available driver, monitor the whole fleet on one map and resolve exceptions fast.",
  },
  {
    icon: BarChart3,
    title: "Fleet analytics",
    body: "Trip volume, completion rates, driver performance and revenue trends rendered with clean charts.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Customer, driver, dispatcher and admin each get a workspace scoped to exactly what they need.",
  },
  {
    icon: Warehouse,
    title: "Built for Ethiopia",
    body: "Addis-centred defaults, ETB pricing and LAN-friendly configuration for on-site operations.",
  },
];

const steps = [
  { step: "01", title: "Book a shipment", body: "Enter pickup, destination, cargo type and weight." },
  { step: "02", title: "Dispatch assigns a driver", body: "The nearest available vehicle is matched to your load." },
  { step: "03", title: "Follow it live", body: "Track the driver's GPS, route and ETA until delivery." },
];

function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tripId, setTripId] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="size-5" aria-hidden />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">
              HabeshaFreight
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/track">Track</Link>
            </Button>
            {user ? (
              <Button asChild size="sm">
                <Link to={ROLE_HOME[user.role] as "/"}>Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <img
            src={heroImage}
            alt="Freight truck crossing the Ethiopian highlands at sunset"
            width={1600}
            height={1008}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <span className="badge-soft">
              <Radio className="size-3.5" aria-hidden />
              Live GPS, not guesswork
            </span>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Freight moving across Ethiopia, visible every kilometre.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              HabeshaFreight gives shippers real-time truck locations, drivers a one-tap trip
              console, and dispatchers a live fleet map with the analytics to run it all.
            </p>

            <form
              className="mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                navigate({ to: "/track", search: { tripId: tripId.trim().toUpperCase() } });
              }}
            >
              <Input
                value={tripId}
                onChange={(event) => setTripId(event.target.value.toUpperCase())}
                placeholder="TRIP-H5UGGP"
                aria-label="Trip ID"
                className="h-12 bg-card font-mono tracking-wider"
              />
              <Button type="submit" size="lg" className="h-12">
                Track shipment
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4">
              {[
                ["1.2k+", "Trips tracked"],
                ["340", "Active drivers"],
                ["99.2%", "On-time rate"],
              ].map(([value, label]) => (
                <div key={label} className="surface-panel px-4 py-3">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Everything a freight operation needs
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            One platform, four workspaces, and a single source of truth for where your cargo is.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="surface-panel card-hover p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-accent/15 text-accent">
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">How it works</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3">
              {steps.map((item) => (
                <li key={item.step} className="surface-panel p-5">
                  <span className="font-mono text-xs font-semibold text-accent">{item.step}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="surface-panel flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold">Ready to move your cargo?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Create an account as a customer, driver or dispatcher in under a minute.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link to="/register">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} HabeshaFreight. Addis Ababa, Ethiopia.</p>
          <div className="flex gap-4">
            <Link to="/track" className="hover:text-foreground">
              Track
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
