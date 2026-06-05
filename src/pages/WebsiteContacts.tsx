import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWebsiteSettingsREST } from '@/lib/supabaseClient';
import { Facebook, Instagram, Smartphone, Mail, MapPin, MessageCircle, Send, Phone, Globe, Zap } from 'lucide-react';
import GlowCard from '@/components/website/GlowCard';

interface WebsiteSettings {
  store_name?: string;
  slogan?: string;
  description?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  snapchat_url?: string;
  phone_number?: string;
  whatsapp_number?: string;
  telegram_number?: string;
  location?: string;
  email?: string;
  logo_url?: string;
}

export default function WebsiteContacts() {
  const { language, isRTL } = useLanguage();
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await getWebsiteSettingsREST();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching website settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const contactChannels = [
    {
      icon: Phone,
      label: language === 'ar' ? 'الهاتف' : 'Téléphone',
      value: settings?.phone_number,
      href: settings?.phone_number ? `tel:${settings.phone_number}` : '#',
      color: '#00D4FF',
      bg: 'rgba(0,212,255,0.07)',
      border: 'rgba(0,212,255,0.2)',
      emoji: '☎️',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: settings?.whatsapp_number,
      href: settings?.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : '#',
      color: '#25D366',
      bg: 'rgba(37,211,102,0.07)',
      border: 'rgba(37,211,102,0.2)',
      emoji: '💬',
    },
    {
      icon: Send,
      label: 'Telegram',
      value: settings?.telegram_number,
      href: settings?.telegram_number ? `https://t.me/${settings.telegram_number}` : '#',
      color: '#00B4D8',
      bg: 'rgba(0,180,216,0.07)',
      border: 'rgba(0,180,216,0.2)',
      emoji: '✈️',
    },
    {
      icon: Mail,
      label: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: settings?.email,
      href: settings?.email ? `mailto:${settings.email}` : '#',
      color: '#FF6B35',
      bg: 'rgba(255,107,53,0.07)',
      border: 'rgba(255,107,53,0.2)',
      emoji: '📧',
    },
    {
      icon: MapPin,
      label: language === 'ar' ? 'الموقع' : 'Localisation',
      value: settings?.location,
      href: '#',
      color: '#7C3AED',
      bg: 'rgba(124,58,237,0.07)',
      border: 'rgba(124,58,237,0.2)',
      emoji: '📍',
    },
  ];

  const socialMedia = [
    { name: 'Facebook', icon: Facebook, url: settings?.facebook_url, color: '#1877F2', glow: 'rgba(24,119,242,0.4)' },
    { name: 'Instagram', icon: Instagram, url: settings?.instagram_url, color: '#E1306C', glow: 'rgba(225,48,108,0.4)' },
    { name: 'TikTok', icon: Globe, url: settings?.tiktok_url, color: '#F1F5F9', glow: 'rgba(241,245,249,0.3)' },
    { name: 'Snapchat', icon: Smartphone, url: settings?.snapchat_url, color: '#FFFC00', glow: 'rgba(255,252,0,0.3)' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#020817' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full"
          style={{ border: '2px solid rgba(0,212,255,0.1)', borderTopColor: '#00D4FF' }}
        />
      </div>
    );
  }

  return (
    <div style={{ background: '#020817', color: '#F1F5F9', minHeight: '100vh' }} className={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 55%)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <motion.div
              animate={{ boxShadow: ['0 0 0px rgba(0,212,255,0)', '0 0 20px rgba(0,212,255,0.25)', '0 0 0px rgba(0,212,255,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm font-bold"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
            >
              <Zap className="w-4 h-4" />
              {language === 'ar' ? 'تواصل معنا' : 'Contactez-nous'}
            </motion.div>

            <h1 className="font-grotesk font-black text-4xl md:text-5xl mb-3">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #00D4FF, #7C3AED, #00D4FF)' }}>
                📞 {language === 'ar' ? 'جهات الاتصال' : 'Nos Contacts'}
              </span>
            </h1>
            <p className="text-base" style={{ color: '#64748B' }}>
              {language === 'ar'
                ? 'تواصل معنا عبر أي قناة — نحن هنا لمساعدتك'
                : 'Contactez-nous via votre canal préféré — Nous sommes là pour vous'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16 space-y-12">

        {/* Store Info card */}
        {settings && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <GlowCard glowColor="cyan" className="text-center p-8 space-y-4">
              {settings.logo_url && (
                <div className="flex justify-center">
                  <motion.img src={settings.logo_url} alt="Logo"
                    className="h-24 w-24 rounded-2xl object-cover"
                    style={{ boxShadow: '0 0 20px rgba(0,212,255,0.2)' }}
                    whileHover={{ scale: 1.05 }}
                  />
                </div>
              )}
              <div>
                <h2 className="font-grotesk font-black text-2xl mb-1" style={{ color: '#F1F5F9' }}>{settings.store_name}</h2>
                <p className="text-sm" style={{ color: '#00D4FF' }}>{settings.slogan}</p>
                {settings.description && (
                  <p className="text-sm mt-3 max-w-xl mx-auto leading-relaxed" style={{ color: '#64748B' }}>{settings.description}</p>
                )}
              </div>
            </GlowCard>
          </motion.div>
        )}

        {/* Contact Channels */}
        <div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="font-grotesk font-bold text-xl mb-5 text-center" style={{ color: '#94A3B8' }}>
            {language === 'ar' ? '📡 قنوات التواصل' : '📡 Canaux de Contact'}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {contactChannels.map((ch, i) => {
              const Icon = ch.icon;
              return ch.value ? (
                <motion.a
                  key={ch.label}
                  href={ch.href}
                  target={ch.href.startsWith('http') ? '_blank' : undefined}
                  rel={ch.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                  whileHover={{ y: -4, boxShadow: `0 0 20px ${ch.color}33` }}
                  className="flex items-center gap-4 p-5 rounded-2xl transition-all"
                  style={{ background: ch.bg, border: `1px solid ${ch.border}`, textDecoration: 'none' }}
                >
                  {/* Hex icon */}
                  <div className="relative flex-shrink-0">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-xl"
                      style={{ border: `1px solid ${ch.color}`, opacity: 0.4, borderRadius: '10px' }}
                    />
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
                      style={{ background: `${ch.color}18`, border: `1px solid ${ch.color}33` }}>
                      <Icon className="w-6 h-6" style={{ color: ch.color }} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: '#64748B' }}>{ch.label}</p>
                    <p className="font-grotesk font-bold text-sm truncate" style={{ color: '#F1F5F9' }}>{ch.value}</p>
                  </div>
                  <div className="text-lg flex-shrink-0">{ch.emoji}</div>
                </motion.a>
              ) : null;
            })}
          </div>
        </div>

        {/* Social Media */}
        {socialMedia.some(m => m.url) && (
          <div className="text-center space-y-6">
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="font-grotesk font-bold text-xl" style={{ color: '#94A3B8' }}>
              📱 {language === 'ar' ? 'تابعنا على وسائل التواصل' : 'Suivez-nous sur les Réseaux'}
            </motion.h2>
            <div className="flex justify-center gap-5 flex-wrap">
              {socialMedia.map((media, i) => {
                const Icon = media.icon;
                return media.url ? (
                  <motion.a key={media.name} href={media.url} target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ scale: 1.1, boxShadow: `0 0 20px ${media.glow}` }}
                    className="flex flex-col items-center gap-2"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: '#0F172A', border: `1px solid ${media.color}33` }}>
                      <Icon className="w-6 h-6" style={{ color: media.color }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#64748B' }}>{media.name}</span>
                  </motion.a>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Location */}
        {settings?.location && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <GlowCard glowColor="violet" className="p-6 text-center space-y-3">
              <MapPin className="w-8 h-8 mx-auto" style={{ color: '#7C3AED' }} />
              <h3 className="font-grotesk font-bold text-lg" style={{ color: '#F1F5F9' }}>
                📍 {language === 'ar' ? 'موقعنا' : 'Notre Localisation'}
              </h3>
              <p className="font-semibold" style={{ color: '#94A3B8' }}>{settings.location}</p>
            </GlowCard>
          </motion.div>
        )}

        {/* Business Hours */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <GlowCard glowColor="cyan" className="p-6">
            <h3 className="font-grotesk font-bold text-lg text-center mb-5" style={{ color: '#F1F5F9' }}>
              ⏰ {language === 'ar' ? 'أوقات العمل' : 'Heures d\'Ouverture'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {[
                { day: language === 'ar' ? 'أيام العمل' : 'Lun – Ven', hours: '9:00 – 18:00', color: '#00D4FF' },
                { day: language === 'ar' ? 'السبت' : 'Samedi', hours: '10:00 – 17:00', color: '#7C3AED' },
                { day: language === 'ar' ? 'الأحد' : 'Dimanche', hours: language === 'ar' ? 'مغلق' : 'Fermé', color: '#64748B' },
              ].map(h => (
                <div key={h.day} className="p-4 rounded-xl" style={{ background: 'rgba(30,58,95,0.3)', border: `1px solid ${h.color}22` }}>
                  <p className="font-bold text-sm mb-1" style={{ color: h.color }}>{h.day}</p>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>{h.hours}</p>
                </div>
              ))}
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}
