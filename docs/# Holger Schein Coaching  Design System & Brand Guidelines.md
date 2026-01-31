**# Holger Schein Coaching | Design System & Brand Guidelines**  
  
**## Brand Overview**  
****Business:**** Professional Life Coaching & StrengthsFinder Certification    
****Target Audience:**** Leaders, professionals, and individuals seeking personal growth and authentic leadership    
****Brand Pillars:**** Trust, Expertise, Warmth, Authenticity, Transformation  
  
**---**  
  
**## 1. Visual Design Philosophy**  
  
**### Core Principles**  
- ****Clean & Modern:**** Minimalist aesthetic with intentional whitespace and breathing room  
- ****Professional & Approachable:**** Sophisticated color palette balanced with warm accents  
- ****Accessible & Inclusive:**** WCAG AA compliant, semantic HTML, clear hierarchy  
- ****Responsive First:**** Mobile-first design scaling gracefully to desktop  
- ****Intentional Details:**** Subtle animations, hover states, and micro-interactions enhance usability  
  
**---**  
  
**## 2. Color System**  
  
**### Primary Color Palette (Exactly 3-5 colors)**  
  
| Token | Hex | RGB | Usage | Semantic Name |  
|-------|-----|-----|-------|---------------|  
| Primary | `#3A5A6D` | rgb(58, 90, 109) | Buttons, Headers, Key CTAs, Primary UI | Deep Teal-Blue |  
| Accent | `#D4A574` | rgb(212, 165, 116) | Highlights, Accents, Hover States | Warm Gold |  
| Background | `#FAFBF9` | rgb(250, 251, 249) | Page background, Light fills | Off-White |  
| Foreground | `#1F2937` | rgb(31, 41, 55) | Body text, Main copy | Charcoal |  
| Gray (Neutral) | `#E5E7EB` | rgb(229, 231, 235) | Borders, Dividers, Subtle fills | Light Gray |  
  
**### Extended Color Support**  
  
| Token | Hex | Usage |  
|-------|-----|-------|  
| Muted Foreground | `#6B7280` | Secondary text, disabled states |  
| Card | `#FFFFFF` | Card backgrounds, overlays |  
| Border | `#E5E7EB` | Borders, dividing lines |  
| Input | `#FFFFFF` | Form inputs, form elements |  
| Destructive | `#EF4444` | Error states, warnings |  
  
**### Color Applications**  
- ****Navigation & CTAs:**** Use primary (#3A5A6D) for high-priority buttons and calls-to-action  
- ****Accent Highlights:**** Use accent (#D4A574) to draw attention to key benefits, testimonials, or secondary CTAs  
- ****Backgrounds:**** Use background (#FAFBF9) for main page background and off-white card fills  
- ****Text:**** Use foreground (#1F2937) for body copy; muted-foreground (#6B7280) for secondary information  
- ****Borders & Dividers:**** Use border color (#E5E7EB) consistently across cards, forms, and sections  
  
**### Contrast & Accessibility**  
- Primary text on light background: WCAG AAA compliant  
- Buttons always have text color adjusted when background changes  
- Minimum button padding ensures touch-friendly interactions (44px minimum height on mobile)  
  
---  
  
## 3. Typography System  
  
### Font Family Selection (Exactly 2 fonts max)  
1. **Display & Headings:** System default (GeistSans) - clean, modern, professional  
2. **Body & UI:** System default (GeistSans) - consistent, readable, accessible  
  
### Type Scale & Hierarchy  
  
| Component | Size | Weight | Line Height | Usage |  
|-----------|------|--------|-------------|-------|  
| Hero Headline | 56px (md: 48px) | Bold (700) | 1.2 | Main page heading, H1 |  
| Section Headline | 40-48px | Bold (700) | 1.2 | Section headers, H2 |  
| Card Headline | 24px | Bold (700) | 1.4 | Card titles, H3 |  
| Body Text | 16px | Regular (400) | 1.6 | Paragraph copy |  
| Small Text | 14px | Regular (400) | 1.5 | Footer, captions |  
| Label/UI | 12-14px | Medium (500) | 1.4 | Button text, labels |  
  
### Typography Best Practices  
- **Line Height:** 1.4-1.6 for body text (use `leading-relaxed` or `leading-6` in Tailwind)  
- **Letter Spacing:** Default, no additional spacing needed  
- **Text Balance:** Use `text-balance` on headlines for optimal line breaks  
- **Emphasis:** Use weight changes (400 → 700) rather than italics for emphasis  
  
---  
  
## 4. Layout & Spacing System  
  
### Layout Method Priority  
1. **Flexbox** - Default for most layouts (navbar, hero, sections)  
2. **CSS Grid** - Complex 2D layouts (process steps, feature grids)  
3. **Avoid:** Floats and absolute positioning unless absolutely necessary  
  
### Spacing Scale (Tailwind Utility)  
Use these specific values consistently:  
- Micro: `gap-2`, `p-2`, `m-2` = 8px  
- Small: `gap-4`, `p-4`, `m-4` = 16px  
- Medium: `gap-6`, `p-6`, `m-6` = 24px  
- Large: `gap-8`, `p-8`, `m-8` = 32px  
- XL: `gap-12`, `p-12`, `m-12` = 48px  
- XXL: `gap-16`, `p-16`, `m-16` = 64px  
  
### Container & Section Sizing  
- **Max Width:** `max-w-7xl` (80rem) for main content container  
- **Horizontal Padding:** `px-4 sm:px-6 lg:px-8` for responsive padding  
- **Section Padding:** `py-20` standard, `py-32` for hero sections  
- **Vertical Spacing:** `mb-6` between related elements, `mb-12` between major sections  
  
### Responsive Breakpoints  
- **Mobile:** < 640px (default styles)  
- **Tablet:** `sm:` (640px), `md:` (768px)  
- **Desktop:** `lg:` (1024px), `xl:` (1280px)  
  
---  
  
## 5. Component Design Patterns  
  
### Navigation / Header  
- **Style:** Sticky header with backdrop blur and semi-transparent background  
- **Layout:** Flexbox with space-between for brand + nav items  
- **Interactions:** Hover state changes text color to primary  
- **Mobile:** Stack vertically, hide desktop links on smaller screens  
- **Branding:** Logo badge with initials "HS" in primary background  
  
### Buttons  
**Primary Button**  
- Background: Primary (#3A5A6D)  
- Text: White  
- Padding: `px-8 py-4` (large), `px-6 py-2` (small)  
- Border Radius: 8px  
- Hover: Opacity change to 90%, smooth transition  
- Icon Space: `gap-2` when including icons like ArrowRight  
  
**Secondary Button**  
- Background: Transparent  
- Border: 1px solid border color  
- Text: Foreground color  
- Hover: Light background fill (muted)  
- Padding: Same as primary  
  
**Accent Button (CTA Sections)**  
- Background: Accent (#D4A574)  
- Text: Accent-foreground (dark)  
- Used in hero and gradient CTA sections  
  
### Cards  
- **Background:** Card color (#FFFFFF)  
- **Border:** 1px border-color (#E5E7EB)  
- **Padding:** `p-8` standard  
- **Border Radius:** 12px (`rounded-xl`)  
- **Hover:** Border transitions to accent color  
- **Icon Container:** Small rounded square (12px) with primary/accent background  
- **Icon Hover:** Changes to accent color with smooth transition  
  
### Section Structure  
- All sections use consistent max-width container  
- Alternating background colors: background → card → background  
- Dividers: `border-b border-border` between sections  
- Section headings centered with `text-center` and `mb-16` spacing  
  
### Process/Step Component  
- Numbered grid layout (4 columns on desktop, 1 on mobile)  
- Connecting lines between steps (desktop only, using pseudo-elements)  
- Numbers styled in accent color, large size (text-3xl)  
- Step descriptions kept brief (secondary text)  
  
---  
  
## 6. Interactive States & Transitions  
  
### Hover States  
- **Buttons:** Smooth color transition (200ms), opacity change  
- **Links:** Text color changes to primary  
- **Cards:** Border color transitions to accent, shadow may lift (optional)  
  
### Transitions  
- Default: `transition-colors` for color changes  
- Duration: Use default (150ms) unless specified  
- Easing: `ease` (default)  
  
### Feedback  
- Active states: Darker shade or accent color  
- Disabled states: Reduced opacity (50%)  
- Focus states: Ring around element for keyboard navigation  
  
---  
  
## 7. Content Sections & Architecture  
  
### Page Sections (Landing Page)  
1. **Navigation** - Sticky, always accessible  
2. **Hero** - Large headline, subheadline, dual CTAs, illustrative area  
3. **How I Help** - 3-column card grid showcasing services  
4. **About** - 2-column split (text + image/stat area)  
5. **Coaching Process** - 4-step visual journey with connections  
6. **CTA Section** - High-converting call-to-action with gradient background  
7. **Footer** - Branding and copyright  
  
### Typical Page Additions (for full-stack site)  
- **Services/Offerings Page:** Detailed card layouts with pricing tables  
- **About Page:** Extended biography, credentials, testimonials  
- **Blog/Resources:** Article listings with featured images and excerpts  
- **Contact Page:** Form with location/email information  
- **Testimonials/Case Studies:** Quote cards with headshots and metrics  
- **FAQ:** Accordion component with primary colors  
- **Pricing:** Tiered pricing cards with primary CTAs  
  
---  
  
## 8. Form & Input Design  
  
### Input Fields  
- **Background:** Input color (#FFFFFF)  
- **Border:** 1px border-color (#E5E7EB)  
- **Padding:** `px-4 py-2` standard  
- **Border Radius:** `rounded-lg` (8px)  
- **Focus:** Ring in primary color  
- **Placeholder:** Muted text color  
  
### Form Layout  
- **Spacing:** `gap-6` between form groups  
- **Labels:** Positioned above inputs, font-weight 500, text-sm  
- **Validation:** Red border on error, error message below field  
- **Submit:** Use primary button style with full width on mobile  
  
---  
  
## 9. Imagery & Visual Assets  
  
### Image Styles  
- **Border Radius:** `rounded-2xl` for large imagery (24px)  
- **Aspect Ratio:** 1:1 for avatars, 16:9 for featured images  
- **Placeholders:** Use gradient overlays or icon systems  
- **Accessibility:** Always include descriptive alt text  
  
### Icon System  
- **Icon Library:** Lucide React icons (24px standard size)  
- **Colors:** Primary for main icons, accent on hover  
- **Spacing:** `gap-2` when paired with text  
  
---  
  
## 10. Responsive Design Strategy  
  
### Mobile-First Approach  
- Design starts at mobile (< 640px)  
- Enhance progressively: `sm:`, `md:`, `lg:` prefixes  
  
### Key Responsive Patterns  
- **Navigation:** Vertical stack on mobile, horizontal on desktop  
- **Hero:** Single column on mobile, 2-column on lg+  
- **Grids:** 1 column mobile, 2-3 columns on md+  
- **Text:** Smaller sizes on mobile (48px h1 → 56px on md+)  
- **Padding:** Tighter on mobile (`px-4`), wider on desktop (`lg:px-8`)  
  
### Touch Targets  
- Minimum 44px × 44px for interactive elements  
- Button padding: `py-4` or higher on mobile  
- Adequate spacing between clickable areas  
  
---  
  
## 11. Accessibility Standards  
  
### WCAG Compliance  
- **Target:** WCAG AA (Level AA) minimum  
- **Color Contrast:** 4.5:1 for normal text, 3:1 for large text  
- **Focus States:** Visible keyboard navigation indicators  
- **Semantic HTML:** Use `main`, `section`, `nav`, `header`, `footer` elements  
  
### Screen Reader Support  
- Descriptive alt text for all images  
- ARIA labels for icon-only buttons  
- Proper heading hierarchy (H1 → H2 → H3)  
- Skip to main content link  
  
---  
  
## 12. Performance Considerations  
  
### Optimization Guidelines  
- **Images:** Compress and use modern formats (WebP with fallbacks)  
- **Fonts:** Leverage system fonts for faster load times  
- **CSS:** Use Tailwind for minimal custom CSS  
- **Animations:** Keep animations subtle and performant  
- **Lazy Loading:** Implement for below-fold images  
  
---  
  
## 13. Brand Voice & Messaging  
  
### Tone  
- Professional yet warm and approachable  
- Empowering and growth-focused  
- Honest and transparent  
- Conversational (not corporate jargon-heavy)  
  
### Key Messages  
- "Discover Your Strengths" - StrengthsFinder positioning  
- "Navigate Life Transitions with Confidence" - Life coaching value  
- "Authentic Leadership" - Development approach  
- "Transform Your Story" - Overarching brand promise  
  
---  
  
## 14. Design System Usage Examples  
  
### Creating a New Service Card  
```  
<div className="p-8 rounded-xl bg-background border border-border hover:border-accent transition-colors group">  
  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary mb-6 flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-colors">  
    <IconName className="w-6 h-6" />  
  </div>  
  <h3 className="text-xl font-bold text-foreground mb-3">Service Title</h3>  
  <p className="text-muted-foreground leading-relaxed">Service description</p>  
</div>  
```  
  
### Creating a CTA Section  
```  
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">  
  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white p-12 md:p-16">  
    <h2 className="text-4xl md:text-5xl font-bold mb-6">Headline</h2>  
    <p className="text-lg text-white/90 mb-8 max-w-2xl">Description</p>  
    <button className="px-8 py-4 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90">CTA</button>  
  </div>  
</section>  
```  
  
---  
  
## 15. Future Expansion Pages & Components  
  
### Priority 1: High-Conversion Pages  
1. **Coaching Services Page** - Detailed offerings, benefits, pricing  
2. **About/Bio Page** - Extended credibility, credentials, approach  
3. **Testimonials Page** - Client success stories with metrics  
4. **Blog/Resources** - Thought leadership, SEO benefits  
  
### Priority 2: Engagement Features  
1. **Contact Form** - Lead capture with validation  
2. **Calendar Integration** - Booking system (Calendly embed)  
3. **Newsletter Signup** - Email capture in footer  
4. **FAQ Section** - Accordion component for common questions  
  
### Priority 3: Advanced Features  
1. **Client Portal** - Login for existing clients  
2. **Payment Integration** - Session booking with payment  
3. **CMS Integration** - Blog content management  
4. **Analytics Tracking** - Event tracking for conversions  
  
---  
  
## 16. Deployment & Maintenance  
  
### Tech Stack  
- **Framework:** Next.js 16 (App Router)  
- **Styling:** Tailwind CSS v4  
- **Icons:** Lucide React  
- **Fonts:** System defaults (GeistSans)  
- **Hosting:** Vercel (recommended)  
  
### Browser Support  
- Chrome/Edge: Latest 2 versions  
- Firefox: Latest 2 versions  
- Safari: Latest 2 versions  
- Mobile browsers: iOS Safari 14+, Chrome Android latest  
  
### Maintenance  
- Review analytics quarterly  
- Update testimonials/case studies bi-annually  
- A/B test CTA copy seasonally  
- Refresh imagery as needed for brand consistency  
  
