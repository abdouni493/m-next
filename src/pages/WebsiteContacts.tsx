import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWebsiteSettingsREST } from '@/lib/supabaseClient';
import {
  Facebook,
  Instagram,
  Smartphone,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Phone,
  Globe,
} from 'lucide-react';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const contactChannels = [
    {
      icon: Phone,
      label: language === 'ar' ? 'الهاتف' : 'Téléphone',
      value: settings?.phone_number,
      href: settings?.phone_number ? `tel:${settings.phone_number}` : '#',
      color: 'from-blue-500 to-blue-600',
      emoji: '☎️',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: settings?.whatsapp_number,
      href: settings?.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : '#',
      color: 'from-green-500 to-green-600',
      emoji: '💬',
    },
    {
      icon: Send,
      label: 'Telegram',
      value: settings?.telegram_number,
      href: settings?.telegram_number ? `https://t.me/${settings.telegram_number}` : '#',
      color: 'from-cyan-500 to-cyan-600',
      emoji: '✈️',
    },
    {
      icon: Mail,
      label: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: settings?.email,
      href: settings?.email ? `mailto:${settings.email}` : '#',
      color: 'from-red-500 to-red-600',
      emoji: '📧',
    },
    {
      icon: MapPin,
      label: language === 'ar' ? 'الموقع' : 'Localisation',
      value: settings?.location,
      href: '#',
      color: 'from-purple-500 to-purple-600',
      emoji: '📍',
    },
  ];

  const socialMedia = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: settings?.facebook_url,
      color: 'hover:text-blue-600 dark:hover:text-blue-400',
      label: 'Facebook',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: settings?.instagram_url,
      color: 'hover:text-pink-600 dark:hover:text-pink-400',
      label: 'Instagram',
    },
    {
      name: 'TikTok',
      icon: Globe,
      url: settings?.tiktok_url,
      color: 'hover:text-slate-900 dark:hover:text-white',
      label: 'TikTok',
    },
    {
      name: 'Snapchat',
      icon: Smartphone,
      url: settings?.snapchat_url,
      color: 'hover:text-yellow-500 dark:hover:text-yellow-400',
      label: 'Snapchat',
    },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          📞 {language === 'ar' ? 'جهات الاتصال' : 'Nos Contacts'}
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          {language === 'ar'
            ? 'تواصل معنا عبر أي قناة - نحن هنا لمساعدتك'
            : 'Contactez-nous via votre canal préféré - Nous sommes là pour vous'}
        </p>
      </motion.div>

      {/* Store Info */}
      {settings && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-8 rounded-3xl border-2 border-blue-200 dark:border-blue-700 text-center space-y-4"
        >
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="h-24 w-24 rounded-xl mx-auto shadow-lg" />
          )}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {settings.store_name}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
              {settings.slogan}
            </p>
            {settings.description && (
              <p className="text-slate-700 dark:text-slate-300 mt-4 max-w-2xl mx-auto">
                {settings.description}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Contact Channels */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {contactChannels.map((channel) => {
          const Icon = channel.icon;
          return (
            <motion.div
              key={channel.label}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-blue-200 dark:border-blue-700"
            >
              <a
                href={channel.href}
                target={channel.href.startsWith('http') ? '_blank' : undefined}
                rel={channel.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="block"
              >
                <div className={`bg-gradient-to-r ${channel.color} p-6 text-white text-center`}>
                  <div className="text-5xl mb-2">{channel.emoji}</div>
                  <h3 className="text-xl font-bold">{channel.label}</h3>
                </div>

                <div className="p-6 space-y-4">
                  {channel.value ? (
                    <>
                      <p className="text-center text-slate-700 dark:text-slate-300 font-bold text-lg break-all">
                        {channel.value}
                      </p>
                      <Button
                        className={`w-full bg-gradient-to-r ${channel.color} text-white font-bold hover:shadow-lg`}
                        size="lg"
                      >
                        <Icon className="h-5 w-5 mr-2" />
                        {language === 'ar' ? 'اتصل الآن' : 'Contactez'}
                      </Button>
                    </>
                  ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 'غير متوفر' : 'Non disponible'}
                    </p>
                  )}
                </div>
              </a>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Social Media Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            📱 {language === 'ar' ? 'تابعنا على وسائل التواصل' : 'Suivez-nous sur les Réseaux'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar'
              ? 'تابعنا للحصول على أحدث العروض والأخبار'
              : 'Suivez-nous pour les dernières offres et actualités'}
          </p>
        </div>

        <div className="flex justify-center gap-8 flex-wrap">
          {socialMedia.map((media) => {
            const Icon = media.icon;
            return media.url ? (
              <motion.a
                key={media.name}
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, rotate: 10 }}
                className="text-slate-700 dark:text-slate-300 transition-all"
              >
                <div className="bg-white dark:bg-slate-800 rounded-full p-6 border-2 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-2xl">
                  <Icon className={`h-8 w-8 ${media.color}`} />
                </div>
                <p className="text-center mt-2 font-bold text-sm">{media.label}</p>
              </motion.a>
            ) : null;
          })}
        </div>
      </motion.div>

      {/* Location Map Section */}
      {settings?.location && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              📍 {language === 'ar' ? 'موقعنا' : 'Notre Localisation'}
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xl border-2 border-blue-200 dark:border-blue-700">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 text-center">
              <MapPin className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <p className="text-lg text-slate-700 dark:text-slate-300 font-bold">
                {settings.location}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Contact Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-8 rounded-3xl border-2 border-purple-200 dark:border-purple-700 max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {language === 'ar' ? '✉️ أرسل لنا رسالة' : '✉️ Envoyez-nous un Message'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar'
              ? 'سنرد عليك في أسرع وقت'
              : 'Nous vous répondrons dès que possible'}
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder={language === 'ar' ? 'اسمك' : 'Votre Nom'}
            className="w-full bg-white dark:bg-slate-700 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 focus:border-purple-500 outline-none"
          />
          <input
            type="email"
            placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'Votre Email'}
            className="w-full bg-white dark:bg-slate-700 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 focus:border-purple-500 outline-none"
          />
          <textarea
            placeholder={language === 'ar' ? 'رسالتك' : 'Votre Message'}
            rows={4}
            className="w-full bg-white dark:bg-slate-700 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 focus:border-purple-500 outline-none resize-none"
          />
          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 text-lg">
            <Send className="h-5 w-5 mr-2" />
            {language === 'ar' ? 'إرسال' : 'Envoyer'}
          </Button>
        </div>
      </motion.div>

      {/* Business Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-8 rounded-3xl border-2 border-blue-200 dark:border-blue-700 text-center space-y-4"
      >
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
          ⏰ {language === 'ar' ? 'أوقات العمل' : 'Heures d\'Ouverture'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'أيام العمل' : 'Jours Ouvrables'}
            </p>
            <p className="text-slate-600 dark:text-slate-400">9:00 - 18:00</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'السبت' : 'Samedi'}
            </p>
            <p className="text-slate-600 dark:text-slate-400">10:00 - 17:00</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'الأحد' : 'Dimanche'}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {language === 'ar' ? 'مغلق' : 'Fermé'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
