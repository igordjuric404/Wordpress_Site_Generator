import type { NicheId } from '../../shared/types.js';

export interface PlaceholderTemplate {
  homepage: {
    hero: { headline: string; subheadline: string };
    features: Array<{ title: string; description: string }>;
    cta: string;
  };
  about: string;
  services: string;
  contact: string;
}

// Template variable placeholders
// ${businessName}, ${city}, ${phone}, ${email}

export const PLACEHOLDER_TEMPLATES: Record<NicheId, PlaceholderTemplate> = {
  plumbing: {
    homepage: {
      hero: {
        headline: 'Professional Plumbing Services You Can Trust',
        subheadline: 'Expert plumbers ready to solve your plumbing problems quickly and efficiently',
      },
      features: [
        {
          title: '24/7 Emergency Service',
          description: "Plumbing emergencies don't wait. We're available around the clock to help.",
        },
        {
          title: 'Licensed & Insured',
          description: 'Fully licensed, bonded, and insured for your peace of mind.',
        },
        {
          title: 'Upfront Pricing',
          description: 'Clear, honest pricing with no hidden fees or surprises.',
        },
      ],
      cta: 'Get a Free Quote',
    },
    about: `
      <h2>About Us</h2>
      <p>We are a trusted plumbing company dedicated to providing high-quality service to our community. Our experienced team handles everything from routine maintenance to emergency repairs with professionalism and care.</p>
      
      <h3>Why Choose Us</h3>
      <ul>
        <li>Experienced, certified plumbers</li>
        <li>Modern equipment and techniques</li>
        <li>Commitment to customer satisfaction</li>
        <li>Transparent pricing</li>
      </ul>
    `,
    services: `
      <h2>Our Services</h2>
      <p>We offer comprehensive plumbing solutions for residential and commercial properties.</p>
      
      <h3>Emergency Repairs</h3>
      <p>Available 24/7 for burst pipes, leaks, and other urgent plumbing issues.</p>
      
      <h3>Installation</h3>
      <p>Professional installation of fixtures, water heaters, and plumbing systems.</p>
      
      <h3>Maintenance</h3>
      <p>Regular maintenance to prevent costly problems and extend system life.</p>
      
      <h3>Inspection</h3>
      <p>Thorough inspections to identify and address potential issues.</p>
    `,
    contact: `
      <h2>Get in Touch</h2>
      <p>Need plumbing services? Contact us today for a free estimate.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },

  salon: {
    homepage: {
      hero: {
        headline: 'Look Your Best, Feel Your Best',
        subheadline: 'Expert stylists dedicated to bringing out your natural beauty',
      },
      features: [
        {
          title: 'Expert Stylists',
          description: 'Our team of professionals stays current with the latest trends and techniques.',
        },
        {
          title: 'Premium Products',
          description: 'We use only high-quality, professional-grade products for the best results.',
        },
        {
          title: 'Relaxing Atmosphere',
          description: 'Enjoy a comfortable, welcoming environment while we work our magic.',
        },
      ],
      cta: 'Book Appointment',
    },
    about: `
      <h2>About Our Salon</h2>
      <p>We are passionate about helping our clients look and feel their absolute best. Our team of skilled stylists brings years of experience and ongoing education to deliver exceptional results.</p>
      
      <h3>Our Philosophy</h3>
      <ul>
        <li>Client satisfaction is our top priority</li>
        <li>Continuous education and training</li>
        <li>Using premium, quality products</li>
        <li>Creating a welcoming atmosphere</li>
      </ul>
    `,
    services: `
      <h2>Our Services</h2>
      <p>We offer a full range of hair and beauty services to meet your needs.</p>
      
      <h3>Haircuts</h3>
      <p>Precision cuts tailored to your face shape, hair type, and personal style.</p>
      
      <h3>Coloring</h3>
      <p>From subtle highlights to bold transformations, we create beautiful color.</p>
      
      <h3>Styling</h3>
      <p>Special occasion styling, blowouts, and everyday looks.</p>
      
      <h3>Treatments</h3>
      <p>Deep conditioning, keratin treatments, and hair repair services.</p>
    `,
    contact: `
      <h2>Book Your Appointment</h2>
      <p>Ready for your transformation? Contact us to schedule your visit.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },

  dental: {
    homepage: {
      hero: {
        headline: 'Your Smile, Our Priority',
        subheadline: 'Comprehensive dental care for the whole family in a comfortable environment',
      },
      features: [
        {
          title: 'Experienced Team',
          description: 'Our dental professionals provide expert care with a gentle touch.',
        },
        {
          title: 'Modern Technology',
          description: 'State-of-the-art equipment for accurate diagnosis and treatment.',
        },
        {
          title: 'Patient Comfort',
          description: 'We prioritize your comfort with amenities and sedation options.',
        },
      ],
      cta: 'Schedule Visit',
    },
    about: `
      <h2>About Our Practice</h2>
      <p>We are committed to providing exceptional dental care in a warm, welcoming environment. Our team takes the time to understand your needs and create personalized treatment plans.</p>
      
      <h3>Our Commitment</h3>
      <ul>
        <li>Patient-centered care</li>
        <li>Latest dental technology</li>
        <li>Comprehensive treatment options</li>
        <li>Gentle, compassionate approach</li>
      </ul>
    `,
    services: `
      <h2>Our Services</h2>
      <p>We offer a full spectrum of dental services to keep your smile healthy and beautiful.</p>
      
      <h3>General Dentistry</h3>
      <p>Cleanings, exams, fillings, and preventive care for optimal oral health.</p>
      
      <h3>Cosmetic Dentistry</h3>
      <p>Whitening, veneers, and smile makeovers to enhance your appearance.</p>
      
      <h3>Emergency Care</h3>
      <p>Prompt treatment for dental emergencies when you need it most.</p>
      
      <h3>Preventive Care</h3>
      <p>Education and treatments to prevent dental problems before they start.</p>
    `,
    contact: `
      <h2>Contact Us</h2>
      <p>Ready to schedule your appointment? Get in touch with our friendly team.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },

  legal: {
    homepage: {
      hero: {
        headline: 'Experienced Legal Representation',
        subheadline: 'Dedicated attorneys fighting for your rights and best interests',
      },
      features: [
        {
          title: 'Experienced Attorneys',
          description: 'Our team brings years of legal experience to every case.',
        },
        {
          title: 'Personal Attention',
          description: 'We treat every client as an individual, not just a case number.',
        },
        {
          title: 'Results Focused',
          description: 'We work diligently to achieve the best possible outcomes.',
        },
      ],
      cta: 'Free Consultation',
    },
    about: `
      <h2>About Our Firm</h2>
      <p>We are dedicated to providing exceptional legal services with integrity and professionalism. Our attorneys bring deep expertise and a commitment to achieving favorable outcomes for our clients.</p>
      
      <h3>Our Values</h3>
      <ul>
        <li>Integrity in all we do</li>
        <li>Client communication</li>
        <li>Aggressive representation</li>
        <li>Accessible legal services</li>
      </ul>
    `,
    services: `
      <h2>Practice Areas</h2>
      <p>We provide comprehensive legal services across multiple practice areas.</p>
      
      <h3>Consultation</h3>
      <p>Initial consultations to understand your legal needs and options.</p>
      
      <h3>Representation</h3>
      <p>Skilled representation in negotiations, hearings, and trials.</p>
      
      <h3>Legal Advice</h3>
      <p>Strategic guidance to help you make informed decisions.</p>
      
      <h3>Document Preparation</h3>
      <p>Professional preparation of legal documents and filings.</p>
    `,
    contact: `
      <h2>Contact Us</h2>
      <p>Schedule your free consultation to discuss your legal matter.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },

  restaurant: {
    homepage: {
      hero: {
        headline: 'Exceptional Dining Experience',
        subheadline: 'Fresh ingredients, bold flavors, and warm hospitality',
      },
      features: [
        {
          title: 'Fresh Ingredients',
          description: 'We source the finest local and seasonal ingredients for our dishes.',
        },
        {
          title: 'Expert Chefs',
          description: 'Our culinary team creates memorable dishes with passion and skill.',
        },
        {
          title: 'Warm Atmosphere',
          description: 'Enjoy dining in our welcoming and comfortable space.',
        },
      ],
      cta: 'Make Reservation',
    },
    about: `
      <h2>Our Story</h2>
      <p>We are passionate about creating memorable dining experiences. Our kitchen combines time-honored techniques with creative innovation to deliver dishes that delight and satisfy.</p>
      
      <h3>What Sets Us Apart</h3>
      <ul>
        <li>Locally sourced ingredients</li>
        <li>Seasonally inspired menus</li>
        <li>Exceptional service</li>
        <li>Welcoming atmosphere</li>
      </ul>
    `,
    services: `
      <h2>Dining Options</h2>
      <p>We offer multiple ways to enjoy our cuisine.</p>
      
      <h3>Dine-In</h3>
      <p>Experience our full menu and atmosphere in our comfortable dining room.</p>
      
      <h3>Takeout</h3>
      <p>Enjoy our delicious food in the comfort of your own home.</p>
      
      <h3>Catering</h3>
      <p>Let us cater your next event with customized menus and professional service.</p>
      
      <h3>Delivery</h3>
      <p>Fresh food delivered right to your door.</p>
    `,
    contact: `
      <h2>Visit Us</h2>
      <p>We'd love to serve you. Make a reservation or contact us with questions.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },

  fitness: {
    homepage: {
      hero: {
        headline: 'Transform Your Body and Mind',
        subheadline: 'Expert trainers and modern facilities to help you reach your goals',
      },
      features: [
        {
          title: 'Expert Trainers',
          description: 'Certified fitness professionals to guide and motivate you.',
        },
        {
          title: 'Modern Equipment',
          description: 'State-of-the-art fitness equipment for every workout.',
        },
        {
          title: 'Flexible Programs',
          description: 'Classes and training options to fit your schedule and goals.',
        },
      ],
      cta: 'Start Free Trial',
    },
    about: `
      <h2>About Us</h2>
      <p>We are dedicated to helping you achieve your fitness goals in a supportive, energizing environment. Our team of certified trainers and modern facilities provide everything you need to succeed.</p>
      
      <h3>Our Mission</h3>
      <ul>
        <li>Empowering health transformations</li>
        <li>Building community</li>
        <li>Providing expert guidance</li>
        <li>Making fitness accessible</li>
      </ul>
    `,
    services: `
      <h2>Our Programs</h2>
      <p>We offer comprehensive fitness programs for all levels and goals.</p>
      
      <h3>Personal Training</h3>
      <p>One-on-one sessions customized to your specific goals and needs.</p>
      
      <h3>Group Classes</h3>
      <p>Energizing group workouts led by motivating instructors.</p>
      
      <h3>Membership</h3>
      <p>Full access to our facilities, equipment, and amenities.</p>
      
      <h3>Nutrition Coaching</h3>
      <p>Personalized nutrition guidance to complement your training.</p>
    `,
    contact: `
      <h2>Get Started</h2>
      <p>Ready to begin your fitness journey? Contact us for a free consultation.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },

  realestate: {
    homepage: {
      hero: {
        headline: 'Find Your Perfect Home',
        subheadline: 'Expert real estate services to guide you through every step',
      },
      features: [
        {
          title: 'Local Expertise',
          description: 'Deep knowledge of the local market and neighborhoods.',
        },
        {
          title: 'Personalized Service',
          description: 'We take time to understand your unique needs and preferences.',
        },
        {
          title: 'Proven Results',
          description: 'Track record of successful transactions and satisfied clients.',
        },
      ],
      cta: 'View Listings',
    },
    about: `
      <h2>About Our Agency</h2>
      <p>We are committed to making your real estate experience smooth and successful. Our team of experienced agents provides personalized guidance whether you're buying, selling, or investing.</p>
      
      <h3>Why Choose Us</h3>
      <ul>
        <li>Experienced, licensed agents</li>
        <li>Deep market knowledge</li>
        <li>Dedicated client support</li>
        <li>Strong negotiation skills</li>
      </ul>
    `,
    services: `
      <h2>Our Services</h2>
      <p>Comprehensive real estate services for buyers, sellers, and investors.</p>
      
      <h3>Buying</h3>
      <p>Find your dream home with expert guidance every step of the way.</p>
      
      <h3>Selling</h3>
      <p>Strategic marketing and pricing to sell your property for top dollar.</p>
      
      <h3>Property Management</h3>
      <p>Professional management services for investment properties.</p>
      
      <h3>Consultation</h3>
      <p>Expert advice on market trends and investment opportunities.</p>
    `,
    contact: `
      <h2>Contact Us</h2>
      <p>Ready to start your real estate journey? Get in touch today.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },

  accounting: {
    homepage: {
      hero: {
        headline: 'Financial Clarity for Your Business',
        subheadline: 'Professional accounting services to help you grow and succeed',
      },
      features: [
        {
          title: 'Expert Accountants',
          description: 'Certified professionals with years of industry experience.',
        },
        {
          title: 'Personalized Solutions',
          description: 'Customized services tailored to your specific business needs.',
        },
        {
          title: 'Year-Round Support',
          description: 'Ongoing guidance, not just during tax season.',
        },
      ],
      cta: 'Free Consultation',
    },
    about: `
      <h2>About Our Firm</h2>
      <p>We provide comprehensive accounting and financial services to individuals and businesses. Our team of certified professionals delivers accurate, timely, and insightful financial guidance.</p>
      
      <h3>Our Approach</h3>
      <ul>
        <li>Attention to detail</li>
        <li>Proactive communication</li>
        <li>Strategic financial planning</li>
        <li>Client education</li>
      </ul>
    `,
    services: `
      <h2>Our Services</h2>
      <p>Complete financial services for individuals and businesses of all sizes.</p>
      
      <h3>Tax Preparation</h3>
      <p>Accurate tax preparation and strategic planning to minimize liability.</p>
      
      <h3>Bookkeeping</h3>
      <p>Reliable bookkeeping services to keep your finances organized.</p>
      
      <h3>Payroll</h3>
      <p>Complete payroll processing and compliance services.</p>
      
      <h3>Business Advisory</h3>
      <p>Strategic financial guidance to help your business grow.</p>
    `,
    contact: `
      <h2>Contact Us</h2>
      <p>Let's discuss how we can help with your financial needs.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },

  automotive: {
    homepage: {
      hero: {
        headline: 'Quality Auto Repair You Can Trust',
        subheadline: 'Honest, reliable automotive service to keep you on the road',
      },
      features: [
        {
          title: 'Certified Mechanics',
          description: 'ASE-certified technicians with extensive experience.',
        },
        {
          title: 'Honest Pricing',
          description: 'Transparent estimates with no hidden fees or surprises.',
        },
        {
          title: 'Quality Parts',
          description: 'We use high-quality parts backed by warranty.',
        },
      ],
      cta: 'Schedule Service',
    },
    about: `
      <h2>About Our Shop</h2>
      <p>We are committed to providing honest, quality automotive repair and maintenance services. Our certified technicians treat every vehicle with care and attention to detail.</p>
      
      <h3>Our Promise</h3>
      <ul>
        <li>Honest diagnostics and recommendations</li>
        <li>Fair, competitive pricing</li>
        <li>Quality workmanship</li>
        <li>Timely service</li>
      </ul>
    `,
    services: `
      <h2>Our Services</h2>
      <p>Complete automotive repair and maintenance for all makes and models.</p>
      
      <h3>Oil Change</h3>
      <p>Quick, professional oil changes to keep your engine running smoothly.</p>
      
      <h3>Brake Service</h3>
      <p>Complete brake inspections, repairs, and replacements.</p>
      
      <h3>Diagnostics</h3>
      <p>Advanced computer diagnostics to identify and solve problems.</p>
      
      <h3>Tire Service</h3>
      <p>Tire sales, mounting, balancing, and rotation services.</p>
    `,
    contact: `
      <h2>Contact Us</h2>
      <p>Schedule your service appointment or get a quote today.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },

  general: {
    homepage: {
      hero: {
        headline: 'Welcome to Our Business',
        subheadline: 'Professional services tailored to meet your needs',
      },
      features: [
        {
          title: 'Quality Service',
          description: 'We are committed to delivering exceptional results every time.',
        },
        {
          title: 'Experienced Team',
          description: 'Our skilled professionals bring expertise to every project.',
        },
        {
          title: 'Customer Focus',
          description: 'Your satisfaction is our top priority.',
        },
      ],
      cta: 'Contact Us',
    },
    about: `
      <h2>About Us</h2>
      <p>We are dedicated to providing high-quality services to our valued customers. Our team brings professionalism, expertise, and a commitment to excellence to everything we do.</p>
      
      <h3>Our Values</h3>
      <ul>
        <li>Excellence in everything we do</li>
        <li>Integrity and transparency</li>
        <li>Customer satisfaction</li>
        <li>Continuous improvement</li>
      </ul>
    `,
    services: `
      <h2>Our Services</h2>
      <p>We offer a range of professional services to meet your needs.</p>
      
      <h3>Service 1</h3>
      <p>Description of your first main service offering.</p>
      
      <h3>Service 2</h3>
      <p>Description of your second main service offering.</p>
      
      <h3>Service 3</h3>
      <p>Description of your third main service offering.</p>
      
      <h3>Service 4</h3>
      <p>Description of your fourth main service offering.</p>
    `,
    contact: `
      <h2>Contact Us</h2>
      <p>We'd love to hear from you. Get in touch today.</p>
      [contact-form-7 id="1" title="Contact form 1"]
    `,
  },
};

/**
 * Populate template variables
 */
export function populateTemplate(
  template: string,
  vars: { businessName: string; city?: string; phone?: string; email?: string }
): string {
  let result = template;
  result = result.replace(/\$\{businessName\}/g, vars.businessName);
  result = result.replace(/\$\{city\}/g, vars.city || 'your area');
  result = result.replace(/\$\{phone\}/g, vars.phone || '');
  result = result.replace(/\$\{email\}/g, vars.email || '');
  return result;
}

/**
 * Get homepage content HTML from template
 */
export function getHomepageHtml(niche: NicheId, businessName: string): string {
  const template = PLACEHOLDER_TEMPLATES[niche].homepage;

  return `
    <div class="hero-section">
      <h1>${template.hero.headline}</h1>
      <p class="subheadline">${template.hero.subheadline}</p>
      <a href="/contact" class="cta-button">${template.cta}</a>
    </div>
    
    <div class="features-section">
      <h2>Why Choose ${businessName}</h2>
      <div class="features-grid">
        ${template.features
          .map(
            (f) => `
          <div class="feature">
            <h3>${f.title}</h3>
            <p>${f.description}</p>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}
