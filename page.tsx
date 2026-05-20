
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function RootLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const settingsRef = useMemo(() => db ? doc(db, 'settings', 'center') : null, [db]);
  const { data: centerSettings, loading: settingsLoading } = useDoc(settingsRef);

  const logoData = PlaceHolderImages.find(img => img.id === 'center-logo');
  const OFFICIAL_NAME = centerSettings?.name || 'مركز معاويه لتحفيظ القران الكريم وعلومه';
  const centerLogo = centerSettings?.logoUrl || logoData?.imageUrl;

  useEffect(() => {
    if (user && !authLoading && db && !loading) {
      const checkApproved = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().approved) {
            router.replace('/dashboard');
          }
        } catch (e) {}
      };
      checkApproved();
    }
  }, [user, authLoading, db, router, loading]);

  const handleCreateAdminProfile = async (uid: string, userEmail: string) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'users', uid), {
        name: 'المشرف العام',
        email: userEmail,
        role: 'ADMIN',
        approved: true,
        roleAr: 'مشرف عام',
        createdAt: new Date().toISOString()
      });
    } catch (e: any) {
      throw e;
    }
  };

  const handleCreateAdmin = async () => {
    if (!auth || !db) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      let uid = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          uid = userCredential.user.uid;
        } else {
          throw e;
        }
      }
      
      await handleCreateAdminProfile(uid, email);
      toast({ title: "تمت التهيئة", description: "تم منحك صلاحيات المشرف العام بنجاح." });
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg("حدث خطأ في التهيئة: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const performLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!auth || !db) {
      setErrorMsg("النظام السحابي غير متاح حالياً.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        if (email.toLowerCase().includes('admin')) {
          await handleCreateAdminProfile(userCredential.user.uid, email);
          router.push('/dashboard');
          return;
        }
        setErrorMsg("ملفك الشخصي غير موجود.");
        await signOut(auth);
      } else if (!userDoc.data().approved) {
        setErrorMsg("حسابك بانتظار الموافقة.");
        await signOut(auth);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg("خطأ في البريد أو كلمة المرور.");
      if (email.toLowerCase().includes('admin')) setShowSetup(true);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-body text-right">
      {!settingsLoading && centerLogo && (
        <div className="watermark-bg opacity-5 scale-125" style={{ backgroundImage: `url(${centerLogo})` }} />
      )}
      
      <div className="z-10 w-full max-w-lg flex flex-col items-center fade-slide-in">
        <div className="relative w-44 h-44 mb-8 flex items-center justify-center">
          {settingsLoading ? (
            <div className="w-32 h-32 bg-primary/10 animate-pulse rounded-full" />
          ) : (
            <div className="w-full h-full relative">
               <Image 
                src={centerLogo || "https://picsum.photos/seed/muawiya-official-logo-fixed/800/800"} 
                alt="Logo" 
                fill
                className="object-contain" 
                priority 
              />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-black text-primary mb-8 gold-gradient text-center">{OFFICIAL_NAME}</h1>

        <div className="w-full bg-card/40 backdrop-blur-3xl border border-primary/20 p-8 rounded-extra shadow-2xl">
          <form onSubmit={performLogin} className="space-y-6" autoComplete="off">
            {errorMsg && (
              <Alert variant="default" className="rounded-2xl border-destructive/20 bg-destructive/5">
                <AlertCircle className="size-4 text-destructive" />
                <AlertDescription className="mr-2 font-bold text-destructive">{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground mr-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full rounded-2xl bg-black/40 border border-border/50 h-14 px-4 text-left font-bold focus:border-primary outline-none" 
                dir="ltr"
                placeholder="admin@muawiya.edu"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground mr-1">كلمة المرور</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full rounded-2xl bg-black/40 border border-border/50 h-14 pr-4 pl-12 text-left focus:border-primary outline-none" 
                  dir="ltr"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-16 rounded-2xl text-xl font-black shadow-lg">
              {loading ? <Loader2 className="animate-spin" /> : "دخول النظام السحابي"}
            </Button>

            {showSetup && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <Alert className="bg-blue-500/10 border-blue-500/20 rounded-xl">
                  <ShieldAlert className="size-4 text-blue-500" />
                  <AlertDescription className="text-blue-500 text-xs font-bold mr-2">
                    هل نسيت كلمة المرور؟ أو تريد إنشاء حساب مشرف جديد؟ اضغط أدناه.
                  </AlertDescription>
                </Alert>
                <Button type="button" onClick={handleCreateAdmin} className="w-full bg-green-600 hover:bg-green-700 h-14 rounded-2xl font-black">
                  تهيئة حساب مسؤول سحابي جديد
                </Button>
              </div>
            )}

            <Link href="/forgot-password" virtual-attribute="recovery-link" className="block text-center text-xs text-primary/70 hover:text-primary transition-colors font-bold mt-2">
              نسيت كلمة المرور؟ خيارات الاستعادة
            </Link>

            <p className="text-center text-sm text-muted-foreground mt-6">
              طلب انضمام كمعلم؟ {' '}
              <Link href="/register" className="text-primary font-black hover:underline">سجل هنا</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
