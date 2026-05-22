import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// All 10 fields are required by the admin's data-collection process. To keep
// completion rates high despite the length, the form is split into two steps:
// (1) Contact — Name, Phone, Alt. Phone, and (2) Delivery Address — the rest.
// User commits to step 1 with just 3 fields; sunk-cost momentum carries them
// through step 2.
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
  'w-full h-11 bg-transparent border-b border-border text-sm px-0 placeholder:text-muted-foreground/55 focus:outline-none focus:border-foreground transition-colors duration-200';
const labelCls = 'block text-[10px] uppercase tracking-[0.2em] text-foreground/60 mb-1.5 font-medium';

export const WhatsAppButton = ({ phoneNumber, productName, productCode, price, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  // Wizard step: 1 = Contact (Name/Phone/Alt), 2 = Delivery Address.
  const [step, setStep] = useState(1);

  // Lock body scroll + listen for Escape to close while the modal is open.
  // Modal accessibility basics: keyboard users expect Esc to dismiss.
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setClosing(true); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  // No admin WhatsApp number configured → show a clear "not yet available"
  // state instead of letting the user submit and have wa.me/?text=... open
  // a useless contact-picker. Same visual treatment as the disabled state.
  if (!phoneNumber || !phoneNumber.toString().trim()) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-1 border border-border/60 bg-muted/20 py-5">
        <p className="text-xs uppercase tracking-[0.25em] font-light text-muted-foreground">
          Ordering Not Yet Available
        </p>
        <p className="text-2xs text-muted-foreground/50 font-light">Reach us on Instagram</p>
      </div>
    );
  }

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

  // Digits-only input that enforces a max length at the keystroke / paste level.
  // Used for phone, altPhone, pincode — these must never contain letters or symbols.
  const setDigits = (field, maxLen) => (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    setForm((f) => ({ ...f, [field]: digits }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  // Step-scoped validation so "Continue" only blocks on step-1 issues. The
  // final submit re-validates everything as a belt-and-suspenders check in
  // case someone managed to bypass the wizard.
  const validateStep1 = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Required';
    else if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name';
    if (!form.phone.trim()) next.phone = 'Required';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (form.altPhone && !/^[6-9]\d{9}$/.test(form.altPhone)) next.altPhone = 'Enter a valid 10-digit mobile number';
    if (form.phone && form.altPhone && form.phone === form.altPhone) next.altPhone = 'Must be different from primary number';
    setErrors((prev) => ({ ...prev, ...next, fullName: next.fullName || '', phone: next.phone || '', altPhone: next.altPhone || '' }));
    return !next.fullName && !next.phone && !next.altPhone;
  };

  const validateStep2 = () => {
    const required = ['houseName', 'street', 'city', 'district', 'state', 'pincode'];
    const next = {};
    required.forEach((k) => { if (!form[k].trim()) next[k] = 'Required'; });
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) next.pincode = 'Enter a valid 6-digit pincode';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  };

  const validate = () => validateStep1() && validateStep2();

  const goNext = () => {
    if (validateStep1()) setStep(2);
  };
  const goBack = () => setStep(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      // If step-1 fails, snap back so the user sees and fixes the issue.
      if (!validateStep1()) setStep(1);
      return;
    }

    const productUrl = window.location.href;
    const addressLine2 = [form.district.trim(), form.state.trim()].filter(Boolean).join(', ');

    // Plain ASCII only — emojis can render as the Unicode replacement
    // character (�) in WhatsApp depending on the client / URL-encoding path,
    // so we keep the message text-only.
    const lines = [
      `Hello,`,
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
      `Please share more details.`,
    ].filter((l) => l !== null);

    const msg = encodeURIComponent(lines.join('\n'));
    const number = (phoneNumber || '').replace(/\D/g, '');
    const href = number ? `https://wa.me/${number}?text=${msg}` : `https://wa.me/?text=${msg}`;

    window.open(href, '_blank', 'noopener,noreferrer');
    setOpen(false);
    setForm(EMPTY);
    setErrors({});
    setStep(1);
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
      setStep(1); // re-open should start at step 1
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
                <h2 className="font-serif text-xl font-light">Your Details</h2>
                <p className="text-xs text-muted-foreground/65 mt-0.5 font-light">
                  Step {step} of 2 · {step === 1 ? 'Contact' : 'Delivery Address'}
                </p>
                {/* Two progress bars — filled segments grow with step */}
                <div className="flex gap-1.5 mt-2.5">
                  <div className={cn('h-[2px] w-7 transition-colors duration-300', step >= 1 ? 'bg-foreground' : 'bg-border')} />
                  <div className={cn('h-[2px] w-7 transition-colors duration-300', step >= 2 ? 'bg-foreground' : 'bg-border')} />
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Close order form"
                className="h-8 w-8 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-6 space-y-5">

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

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input
                      value={form.fullName}
                      onChange={set('fullName')}
                      placeholder="Your full name"
                      className={inputCls}
                      autoComplete="name"
                      autoFocus
                      maxLength={60}
                    />
                    {errors.fullName && <p className="text-[10px] text-destructive mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number *</label>
                    <input
                      value={form.phone}
                      onChange={setDigits('phone', 10)}
                      placeholder="10-digit mobile"
                      className={inputCls}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                    />
                    {errors.phone && <p className="text-[10px] text-destructive mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>
                      Alternative Number <span className="normal-case tracking-normal text-muted-foreground/30">optional</span>
                    </label>
                    <input
                      value={form.altPhone}
                      onChange={setDigits('altPhone', 10)}
                      placeholder="Another number (if any)"
                      className={inputCls}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                    />
                    {errors.altPhone && <p className="text-[10px] text-destructive mt-1">{errors.altPhone}</p>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>House / Flat Name *</label>
                    <input
                      value={form.houseName}
                      onChange={set('houseName')}
                      placeholder="House name or flat number"
                      className={inputCls}
                      autoComplete="address-line1"
                      autoFocus
                      maxLength={80}
                    />
                    {errors.houseName && <p className="text-[10px] text-destructive mt-1">{errors.houseName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Street / Area *</label>
                    <input
                      value={form.street}
                      onChange={set('street')}
                      placeholder="Street or locality name"
                      className={inputCls}
                      autoComplete="address-line2"
                      maxLength={80}
                    />
                    {errors.street && <p className="text-[10px] text-destructive mt-1">{errors.street}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>
                      Landmark <span className="normal-case tracking-normal text-muted-foreground/30">optional</span>
                    </label>
                    <input
                      value={form.landmark}
                      onChange={set('landmark')}
                      placeholder="Near school, temple, etc."
                      className={inputCls}
                      maxLength={60}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className={labelCls}>City *</label>
                      <input
                        value={form.city}
                        onChange={set('city')}
                        placeholder="City"
                        className={inputCls}
                        autoComplete="address-level2"
                        maxLength={50}
                      />
                      {errors.city && <p className="text-[10px] text-destructive mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Pincode *</label>
                      <input
                        value={form.pincode}
                        onChange={setDigits('pincode', 6)}
                        placeholder="000000"
                        className={inputCls}
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        pattern="[0-9]{6}"
                      />
                      {errors.pincode && <p className="text-[10px] text-destructive mt-1">{errors.pincode}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>District *</label>
                      <input
                        value={form.district}
                        onChange={set('district')}
                        placeholder="District"
                        className={inputCls}
                        maxLength={50}
                      />
                      {errors.district && <p className="text-[10px] text-destructive mt-1">{errors.district}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>State *</label>
                      <input
                        value={form.state}
                        onChange={set('state')}
                        placeholder="State"
                        className={inputCls}
                        autoComplete="address-level1"
                        maxLength={50}
                      />
                      {errors.state && <p className="text-[10px] text-destructive mt-1">{errors.state}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Trust line — only on step 2 where we ask for the address */}
              {step === 2 && (
                <p className="text-[10px] text-muted-foreground/50 leading-relaxed font-light pt-1">
                  We only use this to deliver your order. Nothing is stored on our website.
                </p>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-border/40 shrink-0">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="w-full flex items-center justify-center gap-3 bg-foreground text-background hover:bg-foreground/88 active:scale-[0.985] transition-all duration-200"
                  style={{ minHeight: '52px' }}
                >
                  <span className="text-xs tracking-[0.22em] uppercase font-light">Continue</span>
                  <span aria-hidden className="text-base leading-none">→</span>
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center justify-center gap-2 px-5 border border-border hover:border-foreground/40 hover:bg-muted/30 transition-all duration-200 shrink-0"
                    style={{ minHeight: '52px' }}
                  >
                    <span aria-hidden className="text-base leading-none">←</span>
                    <span className="text-xs tracking-[0.22em] uppercase font-light">Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center gap-3 bg-foreground text-background hover:bg-foreground/88 active:scale-[0.985] transition-all duration-200"
                    style={{ minHeight: '52px' }}
                  >
                    <MessageCircle className="h-4 w-4 opacity-70" strokeWidth={1.5} />
                    <span className="text-xs tracking-[0.22em] uppercase font-light">Send via WhatsApp</span>
                  </button>
                </div>
              )}
              <p className="text-center text-[10px] text-muted-foreground/35 mt-3 font-light">
                {step === 1
                  ? 'Then just a few address details to finish'
                  : 'Opens WhatsApp with your details pre-filled'}
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
