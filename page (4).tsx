
"use client";

import { useMemo, useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award, 
  PlusCircle,
  ShieldCheck,
  SearchX,
  Share2,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';

export default function DashboardPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [role, setRole] = useState<string>('TEACHER');
  
  useEffect(() => {
    if (user && db) {
      getDoc(doc(db, 'users', user.uid)).then(snap => {
        if (snap.exists()) setRole(snap.data().role);
      });
    }
  }, [user, db]);

  const studentsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('role', '==', 'STUDENT'), where('approved', '==', true));
  }, [db]);
  const { data: students } = useCollection(studentsQuery);

  const halaqatQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'halaqat');
  }, [db]);
  const { data: halaqat } = useCollection(halaqatQuery);

  const pendingQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('approved', '==', false));
  }, [db]);
  const { data: pendingUsers } = useCollection(pendingQuery);

  const stats = [
    { title: 'الطلاب النشطين', value: students?.length.toString() || '0', icon: Users, color: 'text-primary' },
    { title: 'إجمالي الحلقات', value: halaqat?.length.toString() || '0', icon: BookOpen, color: 'text-primary' },
    { title: 'صفحات اليوم', value: '0', icon: TrendingUp, color: 'text-primary' },
    { title: 'ختمات القرآن', value: '0', icon: Award, color: 'text-primary' },
  ];

  const handleShareApp = () => {
    const url = window.location.origin;
    const text = `السلام عليكم ورحمة الله وبركاته.. أهلاً بكم في المنصة السحابية لمركز معاوية. يسعدنا انضمامكم إلينا لتسهيل متابعة الطلاب وإدارة الحلقات. رابط المنصة: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isAdmin = ['ADMIN', 'MANAGER', 'DEPUTY_MANAGER', 'SUPERVISOR'].includes(role);

  return (
    <DashboardShell userRole={role}>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary mb-2">مرحباً بك في لوحة التحكم</h1>
            <p className="text-muted-foreground">نظرة عامة على نشاط مركز معاوية السحابي</p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <>
                <Button onClick={handleShareApp} className="rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg">
                  <Share2 className="size-4 ml-2" />
                  مشاركة الرابط مع المعلمين
                </Button>
                <Button asChild className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/dashboard/halaqat" className="flex items-center gap-2">
                    <PlusCircle className="size-4" />
                    إضافة حلقة جديدة
                  </Link>
                </Button>
              </>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <Card key={idx} className="bg-card/50 border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300">
              <CardHeader className="pb-2">
                <stat.icon className={cn("size-6 mb-2", stat.color)} />
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-card/50 border-border rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-4">
              <SearchX className="size-16 text-muted/30 mx-auto" />
              <h3 className="text-xl font-bold text-muted-foreground">لا توجد سجلات إنجاز اليوم</h3>
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                بإمكانك متابعة محفوظات الطلاب سحابياً عبر اختيار الحلقة المخصصة.
              </p>
              {isAdmin && (
                <Button variant="outline" onClick={handleShareApp} className="rounded-xl border-primary/20 text-primary">
                  <MessageSquare className="size-4 ml-2" />
                  إرسال دعوة لمجموعة الواتساب
                </Button>
              )}
            </div>
          </Card>

          {isAdmin && (
            <Card className="bg-card/50 border-border rounded-2xl">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                  <ShieldCheck className="size-5" />
                  طلبات انضمام معلقة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                {(pendingUsers?.length || 0) > 0 ? (
                  <>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Users className="size-8 text-primary" />
                    </div>
                    <p className="text-foreground font-bold">يوجد {pendingUsers?.length} طلب معلق</p>
                    <Button asChild className="mt-4 bg-primary text-primary-foreground rounded-xl">
                      <Link href="/dashboard/approvals">إدارة الطلبات</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Users className="size-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground font-bold">لا توجد طلبات معلقة</p>
                    <Button asChild variant="link" className="mt-2 text-primary">
                      <Link href="/dashboard/approvals">إدارة الطلبات</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
