import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMPTY = {
  fullName: '',
  phone: '',
  altPhone: '',
  houseName: '',
  street: '',
  landmark: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
};

const inputCls =
  'w-full h-10 bg-transparent border-b border-border text-sm px-0 placeholder:text-muted-foreground/55 focus:outline-none focus:border-foreground transition-colors duration-200';
const labelCls = 'block text-[10px] uppercase tracking-[0.2em] text-foreground/60 mb-1.5 font-medium';

export const WhatsAppButton = ({ phoneNumber, productName, productCode, price, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (disabled) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-1 border border-border/60 bg-muted/20 py-5">
        <p className="text-xs uppercase tracking-[0.25em] font-light text-muted-foreground">
          Currently Unavailable
        </p>
        <p className="text-2xs text-muted-foreground/50 font-light">Check back soon</p>
      </div>
    );
  }

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const required = ['fullName', 'phone', 'houseName', 'street', 'city', 'district', 'state', 'pincode'];
    const next = {};
    required.forEach((k) => { if (!form[k].trim()) next[k] = 'Required'; });
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) next.phone = 'Enter a valid 10-digit mobile number';
    if (form.pincode && !/^\d{6}$/.test(form.pincode.replace(/\s/g, ''))) next.pincode = 'Enter a valid 6-digit pincode';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const productUrl = window.location.href;

    const addressLine2 = [form.district.trim(), form.state.trim()].filter(Boolean).join(', ');

    const lines = [
      `Hello 👋`,
      `I'm interested in this product.`,
      ``,
      `*Product:* ${productName}`,
      productCode ? `*Code:* ${productCode}` : null,
      price ? `*Price:* ${price}` : null,
      ``,
      `*Product Link:*`,
      productUrl,
      ``,
      `*Customer Details*`,
      `Name: ${form.fullName.trim()}`,
      `Phone: ${form.phone.trim()}`,
      form.altPhone.trim() ? `Alt. Phone: ${form.altPhone.trim()}` : null,
      ``,
      `Address:`,
      `${form.houseName.trim()}, ${form.street.trim()}`,
      form.landmark.trim() ? `Near ${form.landmark.trim()}` : null,
      `${form.city.trim()} - ${form.pincode.trim()}`,
      addressLine2,
      ``,
      `Please share more details 😊`,
    ].filter((l) => l !== null);

    const msg = encodeURIComponent(lines.join('\n'));
    const number = (phoneNumber || '').replace(/\D/g, '');
    const href = number ? `https://wa.me/${number}?text=${msg}` : `https://wa.me/?text=${msg}`;

    window.open(href, '_blank', 'noopener,noreferrer');
    setOpen(false);
    setForm(EMPTY);
    setErrors({});
  };

  const close = () => {
    setClosing(true); // play exit animation first
  };

  const handlePanelAnimationEnd = (e) => {
    // Only fire when the panel itself finishes — not bubbled events from children
    if (e.target !== e.currentTarget) return;
    if (closing) {
      setOpen(false);
      setClosing(false);
      setErrors({});
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="group w-full flex items-center justify-center gap-3 bg-foreground text-background transition-all duration-300 hover:bg-foreground/88 active:scale-[0.985]"
        style={{ minHeight: '54px' }}
      >
        <MessageCircle className="h-[17px] w-[17px] flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
        <span className="text-xs tracking-[0.22em] uppercase font-light">
          Enquire / Order via WhatsApp
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            style={{ animation: closing ? 'fadeOut 0.22s ease both' : 'fadeIn 0.2s ease both' }}
            onClick={close}
          />

          {/* Panel */}
          <div
            className="relative z-10 bg-background w-full sm:max-w-lg max-h-[92dvh] flex flex-col shadow-2xl sm:border sm:border-border"
            style={{ animation: closing ? 'slideDown 0.22s cubic-bezier(0.25,0.1,0.25,1) both' : 'slideUp 0.28s cubic-bezier(0.25,0.1,0.25,1) both' }}
            onAnimationEnd={handlePanelAnimationEnd}
          >

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-border/40 shrink-0">
              <div>
                <h2 className="font-serif text-xl font-light">Order Details</h2>
                <p className="text-xs text-muted-foreground/65 mt-0.5 font-light">
                  We'll include these in your WhatsApp message
                </p>
              </div>
              <button
                onClick={close}
                className="h-8 w-8 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-6 space-y-6">

              {/* Product summary pill */}
              <div className="bg-muted/30 border border-border/40 px-4 py-3 flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{productName}</p>
                  <p className="text-[10px] text-muted-foreground/45 mt-0.5">
                    {[productCode, price].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 mb-4 font-medium">Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input value={form.fullName} onChange={set('fullName')} placeholder="Your full name" className={inputCls} />
                    {errors.fullName && <p className="text-[10px] text-destructive mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number *</label>
                    <input value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" className={inputCls} inputMode="tel" />
                    {errors.phone && <p className="text-[10px] text-destructive mt-1">{errors.phone}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Alternative Number <span className="normal-case tracking-normal text-muted-foreground/30">optional</span></label>
                    <input value={form.altPhone} onChange={set('altPhone')} placeholder="Another number (if any)" className={inputCls} inputMode="tel" />
                  </div>
                </div>
              </div>

              <hr className="border-border/30" />

              {/* Address */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 mb-4 font-medium">Delivery Address</p>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>House / Flat Name *</label>
                    <input value={form.houseName} onChange={set('houseName')} placeholder="House name or flat number" className={inputCls} />
                    {errors.houseName && <p className="text-[10px] text-destructive mt-1">{errors.houseName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Street / Area *</label>
                    <input value={form.street} onChange={set('street')} placeholder="Street or locality name" className={inputCls} />
                    {errors.street && <p className="text-[10px] text-destructive mt-1">{errors.street}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Landmark <span className="normal-case tracking-normal text-muted-foreground/30">optional</span></label>
                    <input value={form.landmark} onChange={set('landmark')} placeholder="Near school, temple, etc." className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className={labelCls}>City *</label>
                      <input value={form.city} onChange={set('city')} placeholder="City" className={inputCls} />
                      {errors.city && <p className="text-[10px] text-destructive mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Pincode *</label>
                      <input value={form.pincode} onChange={set('pincode')} placeholder="000000" className={inputCls} inputMode="numeric" maxLength={6} />
                      {errors.pincode && <p className="text-[10px] text-destructive mt-1">{errors.pincode}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>District *</label>
                      <input value={form.district} onChange={set('district')} placeholder="District" className={inputCls} />
                      {errors.district && <p className="text-[10px] text-destructive mt-1">{errors.district}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>State *</label>
                      <input value={form.state} onChange={set('state')} placeholder="State" className={inputCls} />
                      {errors.state && <p className="text-[10px] text-destructive mt-1">{errors.state}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-border/40 shrink-0">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-3 bg-foreground text-background h-13 hover:bg-foreground/88 active:scale-[0.985] transition-all duration-200"
                style={{ minHeight: '52px' }}
              >
                <MessageCircle className="h-4 w-4 opacity-70" strokeWidth={1.5} />
                <span className="text-xs tracking-[0.22em] uppercase font-light">Send via WhatsApp</span>
              </button>
              <p className="text-center text-[10px] text-muted-foreground/35 mt-3 font-light">
                Opens WhatsApp with your details pre-filled
              </p>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 1; transform: translateY(0); }    to { opacity: 0; transform: translateY(24px); } }
        @media (min-width: 640px) {
          @keyframes slideUp   { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes slideDown { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(8px) scale(0.98); } }
        }
      `}</style>
    </>
  );
};
