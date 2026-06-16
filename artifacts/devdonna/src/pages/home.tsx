import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { SiReact, SiNextdotjs, SiDjango, SiPostgresql, SiJavascript } from "react-icons/si";
import { Code2, Server, Globe, Terminal, Rocket, PenTool, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function Home() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = (data: z.infer<typeof contactSchema>) => {
    toast({
      title: "Message sent",
      description: "Thanks for reaching out! I'll get back to you shortly.",
    });
    form.reset();
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="font-serif text-2xl font-medium tracking-tight text-primary">
            DevDonna
          </div>
          <Button 
            onClick={() => scrollTo("contact")}
            variant="outline"
            className="rounded-full px-6 font-medium hover:bg-primary hover:text-primary-foreground transition-colors border-primary/20 text-primary"
            data-testid="nav-cta-contact"
          >
            Let's talk
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl"
          >
            <motion.h1 
              variants={fadeInUp}
              className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight mb-8"
            >
              I build the digital products your business <span className="text-primary italic">actually needs.</span>
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-2xl text-muted-foreground max-w-2xl mb-12 font-light leading-relaxed"
            >
              Direct access to a senior developer in Sweden. No agency overhead, no account managers. Just clear communication and reliable delivery.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => scrollTo("contact")}
                className="rounded-full text-base px-8 h-14"
                data-testid="hero-cta-primary"
              >
                Let's work together
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => scrollTo("services")}
                className="rounded-full text-base px-8 h-14"
                data-testid="hero-cta-secondary"
              >
                View services
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Strip */}
      <div className="border-y border-border/50 bg-muted/30 py-6 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm md:text-base font-medium text-muted-foreground uppercase tracking-wider">
            <span>Solo Dev</span>
            <span className="hidden sm:inline text-primary/40">•</span>
            <span>Based in Sweden</span>
            <span className="hidden sm:inline text-primary/40">•</span>
            <span>React</span>
            <span className="hidden sm:inline text-primary/40">•</span>
            <span>Next.js</span>
            <span className="hidden sm:inline text-primary/40">•</span>
            <span>Django</span>
            <span className="hidden sm:inline text-primary/40">•</span>
            <span>5+ Years</span>
          </div>
        </div>
      </div>

      {/* Problem -> Solution */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 lg:gap-16"
          >
            <motion.div variants={fadeInUp} className="bg-secondary/10 p-8 md:p-12 rounded-3xl">
              <h2 className="font-serif text-3xl md:text-4xl mb-8">Your website is losing you business.</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-destructive/50 shrink-0 mt-1" />
                  <span className="text-lg text-muted-foreground font-light">Outdated design signals low trust before visitors even read a word</span>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-destructive/50 shrink-0 mt-1" />
                  <span className="text-lg text-muted-foreground font-light">Slow load times drive 40% of visitors away in under 3 seconds</span>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-destructive/50 shrink-0 mt-1" />
                  <span className="text-lg text-muted-foreground font-light">Generic templates can't communicate what makes your business different</span>
                </li>
              </ul>
            </motion.div>
            <motion.div variants={fadeInUp} className="bg-secondary/20 p-8 md:p-12 rounded-3xl border border-primary/10">
              <h2 className="font-serif text-3xl md:text-4xl mb-8">Modern, purposeful digital products that convert.</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <span className="text-lg text-muted-foreground font-light">Fast, elegant interfaces built for real user behavior</span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <span className="text-lg text-muted-foreground font-light">Custom-built, not cookie-cutter — every decision serves your goals</span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <span className="text-lg text-muted-foreground font-light">Systems that grow with your business, not against it</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 md:py-32 bg-secondary/10">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mb-16 text-center"
          >
            <h2 className="font-serif text-4xl md:text-5xl mb-4">How it works</h2>
            <p className="text-xl text-muted-foreground font-light">A simple, transparent process.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="relative grid md:grid-cols-3 gap-12 md:gap-8"
          >
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] border-t border-dashed border-primary/20 z-0" />
            
            {[
              { num: "01", title: "Share your vision", desc: "You tell me about your project, goals, and timeline. No commitment required." },
              { num: "02", title: "I design and build it", desc: "I handle everything: architecture, design, and development. You get clear progress updates throughout." },
              { num: "03", title: "You launch with confidence", desc: "You receive a production-ready system with handover docs and post-launch support." }
            ].map((step, i) => (
              <motion.div key={i} variants={fadeInUp} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-background border border-primary/10 flex items-center justify-center mb-6 shadow-sm">
                  <span className="font-serif text-4xl text-primary/30">{step.num}</span>
                </div>
                <h3 className="font-serif text-2xl mb-4">{step.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div>
              <h2 className="font-serif text-4xl md:text-5xl mb-8">Crafting software with intentionality.</h2>
              <div className="space-y-6 text-lg text-muted-foreground font-light leading-relaxed">
                <p>
                  Hi, I'm Donna. I run a boutique one-person development studio focused on building exceptional web applications. 
                </p>
                <p>
                  When you work with an agency, you're paying for their offices, their managers, and their bench time. When you work with me, you're investing directly into the product. You get direct collaboration, transparent timelines, and code that is built to last.
                </p>
                <p>
                  I believe in Scandinavian design principles applied to software: it should be elegant, simple to use, and devoid of unnecessary complexity.
                </p>
              </div>
            </div>
            <div className="relative aspect-square max-w-md mx-auto w-full">
              <div className="absolute inset-0 bg-secondary/50 rounded-full blur-3xl opacity-50" />
              <div className="relative h-full w-full border border-primary/20 rounded-2xl overflow-hidden bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center">
                <div className="w-32 h-32 border border-primary/40 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 border border-primary/20 rounded-full scale-[1.5]" />
                  <div className="absolute inset-0 border border-primary/10 rounded-full scale-[2]" />
                  <div className="w-16 h-16 bg-primary/10 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 md:py-32 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mb-16"
          >
            <h2 className="font-serif text-4xl md:text-5xl mb-4">Capabilities</h2>
            <p className="text-xl text-muted-foreground font-light">Outcome-focused solutions for modern businesses.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { title: "Frontend Development", desc: "Fast, accessible, and beautiful user interfaces that customers actually enjoy using.", icon: Globe },
              { title: "Backend Development", desc: "Robust data architectures and secure logic that keep your business running smoothly.", icon: Server },
              { title: "Full-Stack Web Apps", desc: "End-to-end product development, taking your idea from a napkin sketch to a launched product.", icon: Code2 },
              { title: "API Systems", desc: "Connecting your tools and unlocking new revenue streams with well-designed integrations.", icon: Terminal },
              { title: "MVP Development", desc: "Lean, focused builds to test your market assumptions without wasting capital.", icon: Rocket },
              { title: "Website Modernization", desc: "Rescuing legacy systems and bringing them into the modern web ecosystem.", icon: PenTool },
            ].map((service, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full bg-background/50 backdrop-blur border-border/50 hover:border-primary/30 transition-colors group">
                  <CardHeader>
                    <service.icon className="w-8 h-8 text-primary mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <CardTitle className="font-serif text-xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground font-light leading-relaxed">{service.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-serif text-3xl mb-12">The Tools of the Trade</h2>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
              <div className="flex flex-col items-center gap-3 hover:text-primary transition-colors cursor-default">
                <SiReact className="w-12 h-12" />
                <span className="text-sm font-medium tracking-wide uppercase">React</span>
              </div>
              <div className="flex flex-col items-center gap-3 hover:text-primary transition-colors cursor-default">
                <SiNextdotjs className="w-12 h-12" />
                <span className="text-sm font-medium tracking-wide uppercase">Next.js</span>
              </div>
              <div className="flex flex-col items-center gap-3 hover:text-primary transition-colors cursor-default">
                <SiDjango className="w-12 h-12" />
                <span className="text-sm font-medium tracking-wide uppercase">Django</span>
              </div>
              <div className="flex flex-col items-center gap-3 hover:text-primary transition-colors cursor-default">
                <SiPostgresql className="w-12 h-12" />
                <span className="text-sm font-medium tracking-wide uppercase">PostgreSQL</span>
              </div>
              <div className="flex flex-col items-center gap-3 hover:text-primary transition-colors cursor-default">
                <SiJavascript className="w-12 h-12" />
                <span className="text-sm font-medium tracking-wide uppercase">JavaScript</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-24 md:py-32 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mb-16"
          >
            <h2 className="font-serif text-4xl md:text-5xl mb-4">Selected Work</h2>
            <p className="text-xl text-muted-foreground font-light">Real products solving real problems.</p>
          </motion.div>

          <div className="space-y-12">
            {[
              {
                client: "Nordic Logistics",
                title: "Fleet Management Dashboard",
                outcome: "Reduced dispatch errors by 40% with real-time routing and driver communication.",
                tech: ["React", "PostgreSQL", "WebSockets"],
              },
              {
                client: "Sthlm Marketplace",
                title: "B2B SaaS Platform",
                outcome: "Launched MVP in 8 weeks, leading to successful seed funding round.",
                tech: ["Next.js", "Django REST Framework", "Stripe"],
              },
              {
                client: "Legal Partners Group",
                title: "Client Portal Modernization",
                outcome: "Replaced 10-year-old legacy system with a fast, secure document sharing platform.",
                tech: ["React", "Django", "AWS"],
              }
            ].map((project, i) => (
              <motion.div 
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="group relative bg-background border border-border/50 p-8 md:p-12 rounded-2xl hover:border-primary/30 transition-colors"
              >
                <div className="grid md:grid-cols-[1fr_2fr] gap-8">
                  <div>
                    <div className="text-sm font-medium tracking-wider text-primary uppercase mb-2">{project.client}</div>
                    <h3 className="font-serif text-2xl md:text-3xl mb-4">{project.title}</h3>
                  </div>
                  <div className="flex flex-col justify-between">
                    <p className="text-lg text-muted-foreground font-light leading-relaxed mb-8">
                      {project.outcome}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map(t => (
                        <span key={t} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mb-16 text-center"
          >
            <h2 className="font-serif text-4xl md:text-5xl mb-4">Don't just take my word for it.</h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8"
          >
            {[
              {
                quote: "Donna delivered our MVP in record time without cutting corners. The codebase is clean, the product works, and our investors were impressed. I'd hire her again without hesitation.",
                name: "Erik Lindström",
                company: "Co-founder at Sthlm Marketplace",
                initials: "EL"
              },
              {
                quote: "We came with a vague idea and got back a fully working product. The communication was clear throughout, and the final result exceeded what we had imagined.",
                name: "Sara Johansson",
                company: "CEO at Nordic Legal Group",
                initials: "SJ"
              }
            ].map((testimonial, i) => (
              <motion.div key={i} variants={fadeInUp} className="bg-secondary/10 border border-primary/5 rounded-3xl p-8 md:p-10 relative">
                <div className="font-serif text-7xl text-primary/20 absolute top-6 left-6 leading-none">"</div>
                <div className="relative z-10">
                  <p className="text-xl md:text-2xl font-light italic leading-relaxed mb-8 pt-4 text-foreground/90">
                    {testimonial.quote}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-lg">
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground font-light">{testimonial.company}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mt-8 text-center text-sm text-muted-foreground/60 italic font-light"
          >
            Names and companies are illustrative examples.
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl md:text-6xl mb-6">Ready to build something that works?</h2>
            <p className="text-xl text-muted-foreground font-light">
              Reach out to discuss your project. Or email me directly at <a href="mailto:donna@devdonna.se" className="text-primary hover:underline underline-offset-4">donna@devdonna.se</a>
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" className="h-12 bg-background" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" className="h-12 bg-background" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell me about your project..." 
                          className="min-h-[150px] resize-y bg-background" 
                          {...field} 
                          data-testid="input-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg rounded-full"
                  data-testid="button-submit-contact"
                >
                  Send Message
                </Button>
              </form>
            </Form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-background">
        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-serif text-xl tracking-tight text-primary">
            DevDonna
          </div>
          <div className="text-sm text-muted-foreground font-light">
            © {new Date().getFullYear()} DevDonna. Premium IT Consulting.
          </div>
          <a href="mailto:donna@devdonna.se" className="text-sm font-medium hover:text-primary transition-colors">
            donna@devdonna.se
          </a>
        </div>
      </footer>
    </div>
  );
}
