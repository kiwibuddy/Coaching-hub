import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoLoginDialog } from "@/components/demo-login-dialog";
import { 
  Target, 
  Calendar, 
  LineChart, 
  Users, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  Heart,
  MessageSquare,
  Star
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Goal-Focused Coaching",
    description: "Define clear objectives and track your progress with personalized guidance every step of the way.",
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description: "Book sessions that fit your lifestyle with easy calendar management and reminders.",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description: "Visualize your growth with comprehensive progress reports and milestone celebrations.",
  },
  {
    icon: MessageSquare,
    title: "Continuous Support",
    description: "Stay connected between sessions with messaging, resources, and action items.",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Executive Leader",
    content: "The coaching portal transformed how I approach my career. Having everything in one place made the journey so much clearer.",
    rating: 5,
  },
  {
    name: "James K.",
    role: "Entrepreneur",
    content: "I love being able to review my session notes and track my action items. It keeps me accountable between sessions.",
    rating: 5,
  },
  {
    name: "Elena R.",
    role: "Team Manager",
    content: "The resources library has been invaluable. I can revisit materials whenever I need a refresher.",
    rating: 5,
  },
];

const benefits = [
  "Personalized coaching sessions",
  "Secure document sharing",
  "Progress tracking dashboard",
  "Action item management",
  "Session notes access",
  "Resource library",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold">Holger Coaching</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DemoLoginDialog />
            <Link href="/intake">
              <Button data-testid="button-get-started">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-primary font-medium text-sm uppercase tracking-wider">
                  Transform Your Potential
                </p>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  Your Journey to{" "}
                  <span className="text-primary">Excellence</span>{" "}
                  Starts Here
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Experience personalized coaching designed to unlock your full potential. 
                  Track your progress, access resources, and stay connected throughout your journey.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/intake">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-cta">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-learn-more">
                    Learn More
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-muted-foreground">Free consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-muted-foreground">Flexible packages</span>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-3xl" />
              <div className="relative bg-card rounded-2xl border p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Trusted by Professionals</p>
                      <p className="text-sm text-muted-foreground">Over 500+ coaching sessions completed</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">98%</p>
                      <p className="text-xs text-muted-foreground">Client Satisfaction</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">150+</p>
                      <p className="text-xs text-muted-foreground">Active Clients</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {benefits.slice(0, 4).map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-primary font-medium text-sm uppercase tracking-wider mb-2">
              Features
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and resources you need 
              for a transformative coaching experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="hover-elevate group">
                <CardContent className="p-6">
                  <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-primary font-medium text-sm uppercase tracking-wider mb-2">
              Testimonials
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Hear From Our Clients
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real stories from real people who have transformed their lives through coaching.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Transformation?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take the first step towards the life you envision. Schedule your free consultation today.
          </p>
          <Link href="/intake">
            <Button size="lg" data-testid="button-cta-intake">
              Schedule Free Consultation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-serif font-bold">Holger Coaching</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Holger Coaching. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/intake" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Get Started
              </Link>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
