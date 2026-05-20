
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, ArrowRight, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useAuth } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', info: '', password: '' });
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!auth || !db) {
      toast({ variant: "destructive", title: "خطأ", description: "النظام السحابي غير متصل." });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const userId = userCredential.user.uid;

      await setDoc(doc(db, 'users', userId), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        info: formData.info,
        role: 'TEACHER',
        approved: false,
        roleAr: 'معلم',
        createdAt: new Date().toISOString()
      });

      setSubmitted(true);
      toast({
        title: "تم إرسال طلب الانضمام",
        description: "سيتم مراجعة بياناتك كمعلم وتفعيل حسابك من قبل الإدارة.",
      });
    } catch (error: any) {
      let errorMsg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = "هذا البريد الإلكتروني مستخدم بالفعل.";
      }
      toast({ variant: "destructive", title: "فشل الإرسال", description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 bg-card/50 border-primary/20 rounded-3xl space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-primary">طلبك قيد المراجعة</h1>
          <p className="text-muted-foreground">شكراً لتقديم طلب الانضمام كمعلم. سنقوم بمراجعة سيرتك وتفعيل حسابك قريباً.</p>
          <Button asChild className="w-full bg-primary text-primary-foreground h-12 rounded-xl">
            <Link href="/">العودة للرئيسية</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 py-20">
      <div className="z-10 w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-primary">طلب انضمام كمعلم</h1>
          <p className="text-muted-foreground">ساهم في نشر كتاب الله عبر منصة مركز معاوية السحابية</p>
        </div>

        <Card className="bg-card/40 backdrop-blur-md border-border rounded-3xl shadow-2xl">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <CardTitle className="text-xl font-bold">بيانات المعلم</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6 text-right" dir="rtl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الثلاثي</Label>
                  <Input 
                    required 
                    className="rounded-xl h-12"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الجوال</Label>
                  <Input 
                    type="tel" 
                    required 
                    className="rounded-xl h-12 text-left" 
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input 
                  type="email" 
                  required 
                  className="rounded-xl h-12 text-left" 
                  dir="ltr"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className="rounded-xl h-12 text-left pr-10" 
                    dir="ltr"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الخبرات والإجازات القرآنية</Label>
                <Textarea 
                  placeholder="مثال: مجاز في حفص، خبرة 5 سنوات في التحفيظ..."
                  className="rounded-xl min-h-[100px]"
                  value={formData.info}
                  onChange={(e) => setFormData({...formData, info: e.target.value})}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-14 rounded-xl text-lg font-bold shadow-lg">
                {loading ? "جاري الإرسال..." : "إرسال طلب الانضمام سحابياً"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
