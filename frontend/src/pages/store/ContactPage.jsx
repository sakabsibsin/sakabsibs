import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Instagram, Phone, ArrowLeft } from 'lucide-react';
import { useSettings } from '@/features/auth/hooks';
import { STORE_NAME } from '@/constants/config';

// Store-page rule: pure opacity, no translate motion.
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
});

export const ContactPage = () => {
  useEffect(() => { document.title = 'Sakab Sibs — Contact'; }, []);
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const whatsapp = settings?.whatsapp_number || '919110225313';
  const phone = settings?.store_phone || '';

  const channels = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: `+${whatsapp}`,
      href: `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
      cta: 'Chat with us',
      color: 'text-[#075E54]',
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: '@sakab.sibs',
      href: 'https://www.instagram.com/sakab.sibs',
      cta: 'Follow us',
      color: 'text-foreground',
    },
    ...(phone
      ? [{
          icon: Phone,
          label: 'Phone',
          value: phone,
          href: `tel:${phone.replace(/\D/g, '')}`,
          cta: 'Call us',
          color: 'text-foreground',
        }]
      : []),
  ];

  return (
    <div className="container-store pt-4 pb-10 sm:pt-6 sm:pb-16 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 mb-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        <span className="text-2xs tracking-[0.25em] uppercase font-light">Back</span>
      </button>

      <motion.div {...fadeUp(0)} className="mb-8 space-y-3">
        <p className="label-overline">Reach Out</p>
        <h1 className="font-serif text-[2.5rem] font-light leading-tight">Contact Us</h1>
        <p className="text-sm font-light text-muted-foreground">
          We&apos;re available on WhatsApp and Instagram. Reach out for orders, enquiries, or just to say hi.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {channels.map(({ icon: Icon, label, value, href, cta, color }, i) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...fadeUp(i * 0.1)}
            className="group flex flex-col gap-4 p-6 border border-border bg-card hover:border-foreground/30 transition-all duration-200"
          >
            <div className={`${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xs tracking-[0.2em] uppercase text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
            <span className="text-2xs tracking-[0.18em] uppercase font-light text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
              {cta} &rarr;
            </span>
          </motion.a>
        ))}
      </div>

      <motion.div {...fadeUp(0.3)} className="mt-6 bg-muted/40 border border-border p-6">
        <p className="text-xs text-muted-foreground font-light leading-relaxed">
          <span className="font-medium text-foreground">{STORE_NAME}</span> takes all orders through WhatsApp.
          Browse the collection, pick your favourites, and send us a message — we&apos;ll get back to you quickly.
        </p>
      </motion.div>
    </div>
  );
};
