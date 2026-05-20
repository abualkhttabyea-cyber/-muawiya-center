
"use client";

import { useMemo, useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, UserCheck, UserX, Clock, Mail, Phone, KeyRound, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useAuth } from '@/firebase';
import { collection, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ApprovalsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  
  const usersRef = useMemo(() => db ? collection(db, 'users') : null, [db]);
  const pendingQuery = useMemo(() => usersRef ? query(usersRef, where('approved', '==', false)) : null, [usersRef]);
  const { data: pendingUsers, loading: pendingLoading } = useCollection(pendingQuery);

  const resetRef = useMemo(() => db ? collection(db, 'reset_requests') : null, [db]);
  const resetQuery = useMemo(() => resetRef ? query(resetRef, where('status', '==', 'PENDING')) : null, [resetRef]);
  const { data: resetRequests, loading: resetLoading } = useCollection(resetQuery);

  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!db) return;
    const userDoc = doc(db, 'users', id);
    
    if (action === 'approve') {
      await updateDoc(userDoc, { approved: true });
      toast({ title: "تم قبول الطلب", description: "تم تفعيل حساب المستخدم في السحابة بنجاح." });
    } else {
      await deleteDoc(userDoc);
      toast({ variant: "destructive", title: "تم رفض الطلب", description: "تم حذف طلب الانضمام نهائياً." });
    }
  };

  const handleSendResetLink = async (requestId: string, userEmail: string) => {
    if (!auth || !db) return;
    setProcessing(requestId);
    try {
      await sendPasswordResetEmail(auth, userEmail);
      await updateDoc(doc(db, 'reset_requests', requestId), { status: 'COMPLETED' });
      toast({ title: "تم إرسال الرابط", description: `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${userEmail}` });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال الرابط." });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardShell userRole="ADMIN">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-black text-primary">إدارة الاعتمادات والطلبات</h1>
          <p className="text-muted-foreground mt-1">مراجعة الانضمام وطلبات استعادة الوصول السحابية</p>
        </header>

        <Tabs defaultValue="approvals" className="w-full" dir="rtl">
          <TabsList className="bg-muted/30 p-1 rounded-2xl mb-8">
            <TabsTrigger value="approvals" className="rounded-xl px-8">طلبات الانضمام ({pendingUsers?.length || 0})</TabsTrigger>
            <TabsTrigger value="resets" className="rounded-xl px-8">طلبات إعادة التعيين ({resetRequests?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-6">
            {pendingLoading ? (
              <div className="text-center py-10 text-muted-foreground">جاري تحميل الطلبات...</div>
            ) : (pendingUsers?.length || 0) > 0 ? (
              pendingUsers?.map((user: any) => (
                <Card key={user.id} className="bg-card/50 border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center font-bold text-primary text-xl border border-primary/10">
                          {user.name?.charAt(0) || '؟'}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            {user.name}
                            <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
                              {user.roleAr || 'معلم'}
                            </Badge>
                          </h3>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="size-3" />
                              <span dir="ltr">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="size-3" />
                                <span dir="ltr">{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button onClick={() => handleAction(user.id, 'approve')} className="bg-primary text-primary-foreground rounded-xl px-6">
                          <UserCheck className="size-4 ml-2" /> قبول
                        </Button>
                        <Button onClick={() => handleAction(user.id, 'reject')} variant="ghost" className="text-destructive hover:bg-destructive/10 rounded-xl">
                          <UserX className="size-4 ml-2" /> رفض
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-card/20 rounded-3xl border-2 border-dashed border-border">
                <ShieldCheck className="size-16 text-muted/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-muted-foreground">لا توجد طلبات انضمام حالياً</h3>
              </div>
            )}
          </TabsContent>

          <TabsContent value="resets" className="space-y-6">
            {resetLoading ? (
              <div className="text-center py-10 text-muted-foreground">جاري تحميل الطلبات...</div>
            ) : (resetRequests?.length || 0) > 0 ? (
              resetRequests?.map((req: any) => (
                <Card key={req.id} className="bg-card/50 border-border rounded-2xl overflow-hidden hover:border-accent/30 transition-all border-r-4 border-r-accent/40">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                          <KeyRound className="size-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold" dir="ltr">{req.email}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            تم الطلب في: {new Date(req.createdAt).toLocaleString('ar-SA')}
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleSendResetLink(req.id, req.email)} 
                        disabled={processing === req.id}
                        className="bg-accent text-accent-foreground rounded-xl font-bold"
                      >
                        {processing === req.id ? <Loader2 className="animate-spin" /> : <Send className="size-4 ml-2" />}
                        إرسال رابط استعادة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-card/20 rounded-3xl border-2 border-dashed border-border">
                <KeyRound className="size-16 text-muted/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-muted-foreground">لا توجد طلبات إعادة تعيين حالياً</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
