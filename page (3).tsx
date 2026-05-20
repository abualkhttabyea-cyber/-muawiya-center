"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2, ChevronRight, Loader2, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useAuth } from '@/firebase';
import { doc, collection, addDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestingHelp, setRequestingHelp] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();

  const settingsRef = useMemo(() => db ? doc(db, 'settings', 'center') : null, [db]);
  const { data: centerSettings, loading: settingsLoading } = useDoc(settingsRef);

  const logoData = PlaceHolderImages.find(img => img.id === 'center-logo');
  const centerName = centerSettings?.name || 'مركز معاويه لتحفيظ القران الكريم وعلومه';
  const centerLogo = centerSettings?.logoUrl || logoData?.imageUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
      toast({
        title: "تم إرسال الرابط",
        description: "يرجى التحقق من بريدك الإلكتروني لتعيين كلمة مرور جديدة.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "تأكد من صحة البريد الإلكتروني المدخل.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHelp = async () => {
    if (!db || !email) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى كتابة بريدك الإلكتروني أولاً ليتمكن المشرف من مساعدتك." });
      return;
    }
    setRequestingHelp(true);
    try {
      await addDoc(collection(db, 'reset_requests'), {
        email,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
      toast({
        title: "تم إرسال الطلب للمشرف",
        description: "سيقوم المشرف بمراجعة طلبك وإرسال رابط إعادة التعيين لك قريباً.",
      });
      setSubmitted(true);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال الطلب للمشرف." });
    } finally {
      setRequestingHelp(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden font-body text-right">
        <div className="watermark-bg opacity-5 scale-125" style={{ backgroundImage: centerLogo ? `url(${centerLogo})` : 'none' }} />
        <Card className="max-w-md w-full text-center p-10 bg-card/50 backdrop-blur-xl border-primary/20 rounded-massive space-y-8 z-10 shadow-2xl">
          <div className="w-24 h-24 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="size-12 text-green-500" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-primary">تم استلام طلبك</h1>
            <p className="text-muted-foreground leading-relaxed">
              يرجى التحقق من بريدك الإلكتروني خلال دقائق. <br />
              في حال لم تستلم البريد، سيقوم المشرف بمعالجة طلبك يدوياً قريباً.
            </p>
          </div>
          <Button asChild className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-black text-lg">
            <Link href="/">العودة لتسجيل الدخول</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-body text-right">
      <div className="watermark-bg opacity-5 scale-125" style={{ backgroundImage: centerLogo ? `url(${centerLogo})` : 'none' }} />
      
      <div className="z-10 w-full max-w-lg space-y-8 fade-slide-in">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-40 h-40 mb-4">
            <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full" />
            <div className="relative w-full h-full flex items-center justify-center bg-transparent">
              {settingsLoading ? (
                 <div className="w-32 h-32 bg-primary/10 animate-pulse rounded-full" />
              ) : (
                <Image 
                  src={centerLogo || "https://picsum.photos/seed/muawiya-official-logo-fixed/800/800"} 
                  alt="شعار المركز" 
                  width={160} 
                  height={160}
                  className="object-contain"
                  priority
                />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-black text-primary">{centerName}</h1>
          <h2 className="text-xl font-bold text-muted-foreground">استعادة كلمة المرور</h2>
          <p className="text-muted-foreground text-sm">أدخل بريدك الإلكتروني المسجل لنقوم بمساعدتك</p>
        </div>

        <Card className="bg-card/40 backdrop-blur-3xl border border-primary/20 p-8 md:p-10 rounded-massive shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-primary/70 mr-1 text-xs font-black uppercase tracking-[0.2em]">البريد الإلكتروني</label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@muawiya.edu" 
                  required 
                  className="w-full rounded-2xl bg-black/40 border border-border/50 h-16 pr-14 text-right focus:border-primary transition-all text-lg font-bold outline-none" 
                  dir="ltr"
                />
                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-primary-foreground h-16 rounded-2xl text-xl font-black shadow-lg hover:scale-[1.02] transition-all group"
            >
              <span className="flex items-center justify-center gap-3">
                {loading ? "جاري الإرسال..." : "إرسال رابط استعادة تلقائي"}
                {!loading && <ArrowRight className="size-6 group-hover:-translate-x-2 transition-transform" />}
              </span>
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">أو إذا تعذر الوصول لبريدك</span></div>
            </div>

            <div className="space-y-3">
              {centerSettings?.recoveryPhone && (
                <Button 
                  type="button"
                  variant="outline"
                  asChild
                  className="w-full border-green-500/30 text-green-500 hover:bg-green-500/5 h-14 rounded-2xl font-bold"
                >
                  <a href={`https://wa.me/${centerSettings.recoveryPhone}`} target="_blank" rel="noopener noreferrer">
                    <Phone className="size-5 ml-2" />
                    مراسلة جوال الطوارئ (واتساب)
                  </a>
                </Button>
              )}
              
              {centerSettings?.recoveryEmail && (
                <Button 
                  type="button"
                  variant="outline"
                  asChild
                  className="w-full border-blue-500/30 text-blue-500 hover:bg-blue-500/5 h-14 rounded-2xl font-bold"
                >
                  <a href={`mailto:${centerSettings.recoveryEmail}`}>
                    <Mail className="size-5 ml-2" />
                    مراسلة بريد الطوارئ البديل
                  </a>
                </Button>
              )}

              <Button 
                type="button"
                variant="outline"
                onClick={handleRequestHelp}
                disabled={requestingHelp}
                className="w-full border-primary/30 text-primary hover:bg-primary/5 h-14 rounded-2xl font-bold"
              >
                {requestingHelp ? <Loader2 className="animate-spin ml-2" /> : <MessageSquare className="size-5 ml-2" />}
                إرسال طلب مساعدة للمشرف العام
              </Button>
            </div>
            
            <Link href="/" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm pt-4">
              <ChevronRight className="size-4" />
              العودة لتسجيل الدخول
            </Link>
          </form>
        </Card>
      </div>
    </div>
  );
}
