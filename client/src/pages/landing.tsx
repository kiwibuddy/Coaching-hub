import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoLoginDialog } from "@/components/demo-login-dialog";
import { motion } from "framer-motion";
import {
  fadeUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
  floatVariants,
  heroTextVariants,
  scrollViewport,
} from "@/lib/animations";
import {
  Target,
  ArrowRight,
  CheckCircle,
  Users,
  Star,
  Globe,
  Award,
  Coffee,
  MapPin,
  Calendar,
  MessageCircle,
  Compass,
  TrendingUp,
} from "lucide-react";

// How I Help services
const services = [
  {
    icon: Target,
    title: "StrengthsFinder Coaching",
    description: "Discover your unique talents and learn how to leverage them for meaningful impact in work and life.",
  },
  {
    icon: Compass,
    title: "Life Transitions",
    description: "Navigate career changes, new seasons, and major decisions with clarity and confidence.",
  },
  {
    icon: TrendingUp,
    title: "Leadership Development",
    description: "Grow in emotional awareness and maturity to lead with greater effectiveness and authenticity.",
  },
];

// How Coaching Works steps
const coachingSteps = [
  {
    number: 1,
    title: "Initial Inquiry",
    description: "Fill out the intake form. I'll review and reach out within 48 hours.",
  },
  {
    number: 2,
    title: "Meet & Greet",
    description: "A conversation to see if we're a good fit—about relationship, not sales.",
  },
  {
    number: 3,
    title: "In-Person Sessions",
    description: "80% face-to-face in Tauranga or your location. Real connection.",
    highlighted: true,
  },
  {
    number: 4,
    title: "Reflect & Grow",
    description: "Reflect on insights, set action items. Your portal tracks everything.",
  },
];

// Testimonials
const testimonials = [
  {
    name: "James Mitchell",
    role: "CEO, Tech Startup",
    location: "Auckland",
    content: "Holger helped me see my blind spots as a leader. His StrengthsFinder work revealed why I was burning out—I was leading from my weaknesses instead of my strengths. After 6 months, my team engagement scores are up 40%.",
    category: "Corporate Leadership",
    categoryColor: "primary",
  },
  {
    name: "Pastor David Taufa",
    role: "Senior Pastor",
    location: "Tauranga",
    content: "After 20 years in ministry, I was burning out. Holger's patient, relational approach helped me rediscover my purpose. His cross-cultural experience meant he truly understood Pacific Island church leadership.",
    category: "Church Leadership",
    categoryColor: "success",
  },
  {
    name: "Rachel Wong",
    role: "Business Owner",
    location: "Wellington",
    content: "The StrengthsFinder work transformed how I build my team. I used to hire people just like me—now I understand complementary strengths. Holger doesn't just coach; he genuinely cares about your growth.",
    category: "Small Business",
    categoryColor: "secondary",
  },
  {
    name: "Mark Stevens",
    role: "Career Transition",
    location: "Christchurch",
    content: "During my career transition at 45, Holger helped me see this wasn't a crisis—it was an opportunity. His emotional maturity framework gave me language for feelings I couldn't articulate.",
    category: "Life Transition",
    categoryColor: "primary",
  },
];

// Pricing tiers
const pricingTiers = [
  { label: "Corporate", amount: "$$$" },
  { label: "Small Business", amount: "$$" },
  { label: "Individual/Church", amount: "$" },
];

/** Section spacing and scroll-margin so fixed header doesn’t cover section titles. */
const sectionPadding = "py-16 md:py-20 px-6 md:px-8";
const sectionTitleMargin = "mb-10";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-6 md:px-8 h-16 flex items-center justify-between gap-6">
          <a href="#" className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="Holger Schein Coaching"
              className="h-14 w-auto flex-shrink-0"
            />
            <div className="hidden sm:block min-w-0">
              <span className="font-serif text-lg font-bold leading-tight block">Holger Schein</span>
              <span className="text-[11px] text-muted-foreground block">Life Coaching & StrengthsFinder</span>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
            <a href="#how-i-help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap py-2 px-4 rounded-md hover:bg-muted/50">
              How I Help
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap py-2 px-4 rounded-md hover:bg-muted/50">
              About
            </a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap py-2 px-4 rounded-md hover:bg-muted/50">
              Testimonials
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap py-2 px-4 rounded-md hover:bg-muted/50">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-4 flex-shrink-0">
            <ThemeToggle />
            <DemoLoginDialog />
            <Link href="/intake">
              <Button size="sm" data-testid="button-get-started">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero – enough top padding so first line is visible below fixed header */}
      <section className="pt-36 pb-16 md:pt-40 md:pb-20 px-6 md:px-8 hero-gradient relative scroll-mt-20" id="hero">
        <div className="absolute inset-0 grain-subtle" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-2">
            <div className="space-y-6">
              <motion.div
                className="space-y-5"
                initial="hidden"
                animate="visible"
              >
                <motion.p
                  className="text-primary font-semibold text-xs uppercase tracking-wider"
                  variants={heroTextVariants}
                  custom={0}
                >
                  StrengthsFinder Certified Coach • 35+ Years Experience
                </motion.p>
                <motion.h1
                  className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
                  variants={heroTextVariants}
                  custom={0.1}
                >
                  Holger Schein
                </motion.h1>
                <motion.p
                  className="font-serif text-xl md:text-2xl text-muted-foreground"
                  variants={heroTextVariants}
                  custom={0.2}
                >
                  Life is Your Story:{" "}
                  <span className="text-primary">Make it a Best Seller</span>
                </motion.p>
                <motion.p
                  className="text-base text-muted-foreground max-w-md leading-relaxed [text-wrap:balance]"
                  variants={heroTextVariants}
                  custom={0.3}
                >
                  I help leaders and individuals grow in self-awareness and emotional maturity
                  through internationally recognized coaching, specializing in StrengthsFinder,
                  life transitions, and cross-cultural leadership development.
                </motion.p>
              </motion.div>
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <a href="#meet-greet">
                  <Button className="w-full sm:w-auto" data-testid="button-hero-cta">
                    Schedule a Meet & Greet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="#how-i-help">
                  <Button variant="outline" className="w-full sm:w-auto" data-testid="button-learn-more">
                    Learn More
                  </Button>
                </a>
              </motion.div>
              <motion.div
                className="flex items-center gap-6 pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-muted-foreground">Free consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-xs text-muted-foreground">80% In-Person</span>
                </div>
              </motion.div>
            </div>
            <motion.div
              className="relative hidden lg:block lg:pl-4"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/hero-inspiration.jpg"
                  alt="Person walking confidently through a city - living their best story"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-sm font-medium opacity-90 mb-1">Transformative Coaching</p>
                  <p className="text-xs opacity-75">Helping leaders discover their strengths and unlock their potential</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How I Help Section */}
      <section id="how-i-help" className={`${sectionPadding} bg-muted/30 scroll-mt-20`}>
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className={`text-center ${sectionTitleMargin}`}
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewport}
            variants={fadeUpVariants}
          >
            <p className="text-primary font-medium text-xs uppercase tracking-wider mb-1">
              Services
            </p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
              How I Help
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Personalized coaching that meets you where you are
            </p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-3 gap-6 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewport}
            variants={staggerContainerVariants}
          >
            {services.map((service, i) => (
              <motion.div key={i} variants={staggerItemVariants}>
                <Card className="h-full card-premium group">
                  <CardContent className="p-5 md:p-6">
                    <div className="rounded-lg bg-primary/10 p-2.5 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                      <service.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How Coaching Works Section */}
      <section id="how-it-works" className={`${sectionPadding} scroll-mt-20`}>
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className={`text-center ${sectionTitleMargin}`}
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewport}
            variants={fadeUpVariants}
          >
            <p className="text-primary font-medium text-xs uppercase tracking-wider mb-1">
              The Process
            </p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
              How Coaching Works
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              A relational journey focused on your growth—80% of sessions happen in-person
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewport}
            variants={staggerContainerVariants}
          >
            {coachingSteps.map((step, i) => (
              <motion.div key={i} variants={staggerItemVariants}>
                <Card className={`h-full text-center ${step.highlighted ? "border-primary border-2" : ""}`}>
                  <CardContent className="p-4 md:p-5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-3">
                      {step.number}
                    </div>
                    <h4 className="font-semibold text-sm mb-1.5">{step.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                    {step.highlighted && (
                      <div className="mt-3">
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          Primary Format
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`${sectionPadding} bg-muted/30 scroll-mt-20`}>
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-stretch">
            <motion.div
              className="flex flex-col justify-center space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={scrollViewport}
              variants={fadeUpVariants}
            >
              <div>
                <p className="text-primary font-medium text-xs uppercase tracking-wider mb-2">About Me</p>
                <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
                  Your Story Matters. Let's Make It Count.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  I've spent over 35 years working across cultures—from Europe to the Pacific Islands—helping
                  people discover who they truly are and who they're becoming.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Change happens in relationship.</strong> That's why 80% of my coaching
                  happens in-person. There's something about sitting across from someone, looking them in
                  the eye, and walking alongside them that video calls simply can't replicate.
                </p>
              </div>

              <div className="h-px bg-border" />

              <div>
                <h3 className="font-semibold text-base mb-3">
                  35+ Years of International Experience
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  I bring decades of multi-cultural experience working with individuals and teams
                  within and outside NGO settings. As a fully trained StrengthsFinder coach
                  (Individual Top 5, Couples/Team Coaching, and all 34 Talent Coaching), I help
                  people understand themselves deeply and relate differently to others.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="badge-landing badge-landing-primary">
                    <Globe className="h-3 w-3" /> International Coach
                  </span>
                  <span className="badge-landing badge-landing-success">
                    <Award className="h-3 w-3" /> StrengthsFinder Certified
                  </span>
                  <span className="badge-landing badge-landing-secondary">
                    <Star className="h-3 w-3" /> All 3 Levels
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="badge-landing badge-landing-primary">
                  <MapPin className="h-3 w-3" /> Based in Tauranga, NZ
                </span>
                <span className="badge-landing badge-landing-success">
                  <Globe className="h-3 w-3" /> Serving Internationally
                </span>
                <span className="badge-landing badge-landing-secondary">
                  <Coffee className="h-3 w-3" /> Loves Good Coffee
                </span>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={scrollViewport}
              variants={fadeUpVariants}
            >
              <div className="absolute -inset-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl blur-2xl" />
              <div className="relative h-full min-h-[400px] lg:min-h-[500px] rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/holger.jpg"
                  alt="Holger Schein - Life Coach & StrengthsFinder Specialist"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white font-semibold text-base">Holger Schein</p>
                  <p className="text-white/80 text-xs">Life Coach & StrengthsFinder Specialist</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={`${sectionPadding} scroll-mt-20`}>
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className={`text-center ${sectionTitleMargin}`}
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewport}
            variants={fadeUpVariants}
          >
            <p className="text-primary font-medium text-xs uppercase tracking-wider mb-1">
              Testimonials
            </p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
              What Clients Say
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Real stories from leaders who've experienced transformation
            </p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-2 gap-6 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewport}
            variants={staggerContainerVariants}
          >
            {testimonials.map((testimonial, i) => (
              <motion.div key={i} variants={staggerItemVariants}>
                <Card className="h-full">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-primary/10 h-9 w-9 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.role} • {testimonial.location}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic mb-3">
                      "{testimonial.content}"
                    </p>
                    <span className={`badge-landing badge-landing-${testimonial.categoryColor}`}>
                      {testimonial.category}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`${sectionPadding} bg-muted/30 scroll-mt-20`}>
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewport}
            variants={fadeUpVariants}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
              <CardContent className="relative p-6 md:p-8">
                <div className="text-center mb-8">
                  <p className="text-primary font-medium text-xs uppercase tracking-wider mb-1">
                    Investment
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
                    Flexible, Fair Pricing
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    Pricing reflects your context—corporate, small business, or individual—ensuring
                    coaching is accessible while valuing the depth of experience I bring.
                  </p>
                </div>
                <motion.div
                  className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-6"
                  initial="hidden"
                  whileInView="visible"
                  viewport={scrollViewport}
                  variants={staggerContainerVariants}
                >
                  {pricingTiers.map((tier, i) => (
                    <motion.div
                      key={i}
                      className="text-center p-3 bg-background rounded-lg shadow-sm"
                      variants={staggerItemVariants}
                    >
                      <p className="text-xs text-muted-foreground font-medium mb-1">{tier.label}</p>
                      <p className="text-xl font-bold text-primary">{tier.amount}</p>
                    </motion.div>
                  ))}
                </motion.div>
                <p className="text-center text-xs text-muted-foreground">
                  Specific pricing discussed during Meet & Greet
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Meet & Greet CTA Section */}
      <section id="meet-greet" className={`${sectionPadding} scroll-mt-20`}>
        <div className="container mx-auto max-w-3xl">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={scrollViewport}
            variants={fadeUpVariants}
          >
            <motion.div
              className="inline-flex rounded-full bg-primary/10 p-3 mb-6"
              variants={floatVariants}
              animate="animate"
            >
              <Calendar className="h-6 w-6 text-primary" />
            </motion.div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
              Request a Meet & Greet
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
              Let's see if we're a good fit. I'll review your submission and reach out within 48 hours.
              This isn't a sales pitch—it's a conversation about your story.
            </p>
            <Link href="/intake">
              <Button data-testid="button-cta-intake">
                <MessageCircle className="mr-2 h-4 w-4" />
                Start the Conversation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 inline mr-1 text-green-600 dark:text-green-400" />
              No commitment required • Response within 48 hours
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-6 md:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Holger Schein Coaching"
                className="h-6 w-auto"
              />
              <div>
                <span className="font-serif font-bold text-sm leading-none block">Holger Schein</span>
                <span className="text-[10px] text-muted-foreground">Life Coaching & StrengthsFinder</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Holger Schein Coaching. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="mailto:holgerschein@me.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
